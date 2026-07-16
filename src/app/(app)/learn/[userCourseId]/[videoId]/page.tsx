import { notFound, redirect } from "next/navigation";
import { LearningClient } from "@/components/learning/learning-client";
import { requireOnboardedProfile } from "@/lib/auth";
import { resolveResumeTimestamp } from "@/lib/progress";
import { createClient } from "@/lib/supabase/server";
import type {
  Course,
  CourseVideo,
  Note,
  TimestampNote,
  UserCourse,
  VideoProgress,
} from "@/types/database";

export const metadata = { title: "Learn" };

export default async function LearnPage({
  params,
}: {
  params: Promise<{ userCourseId: string; videoId: string }>;
}) {
  const profile = await requireOnboardedProfile();
  const { userCourseId, videoId } = await params;
  const supabase = await createClient();

  const { data: enrollment } = await supabase
    .from("user_courses")
    .select("*, course:courses(*)")
    .eq("id", userCourseId)
    .eq("user_id", profile.id)
    .maybeSingle();

  if (!enrollment) notFound();

  const userCourse = enrollment as UserCourse & { course: Course };

  const { data: videos } = await supabase
    .from("course_videos")
    .select("*")
    .eq("course_id", userCourse.course_id)
    .order("playlist_position", { ascending: true });

  const list = (videos ?? []) as CourseVideo[];
  const currentVideo = list.find((v) => v.id === videoId);
  if (!currentVideo) {
    const first = list[0];
    if (!first) notFound();
    redirect(`/learn/${userCourseId}/${first.id}`);
  }

  const { data: progressRows } = await supabase
    .from("video_progress")
    .select("*")
    .eq("user_course_id", userCourseId)
    .eq("user_id", profile.id);

  const progressMap = Object.fromEntries(
    ((progressRows ?? []) as VideoProgress[]).map((row) => [
      row.course_video_id,
      row,
    ]),
  );

  const currentProgress = progressMap[currentVideo.id];
  const resumeSeconds = resolveResumeTimestamp(
    currentProgress?.last_timestamp_seconds ??
      (userCourse.current_video_id === currentVideo.id
        ? userCourse.current_timestamp_seconds
        : 0),
    currentVideo.duration_seconds,
  );

  const { data: note } = await supabase
    .from("notes")
    .select("*")
    .eq("user_id", profile.id)
    .eq("user_course_id", userCourseId)
    .eq("course_video_id", currentVideo.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: stamps } = await supabase
    .from("timestamp_notes")
    .select("*")
    .eq("user_id", profile.id)
    .eq("user_course_id", userCourseId)
    .eq("course_video_id", currentVideo.id)
    .order("timestamp_seconds", { ascending: true });

  // Touch last opened without exposing elsewhere
  await supabase
    .from("user_courses")
    .update({
      last_opened_at: new Date().toISOString(),
      current_video_id: currentVideo.id,
    })
    .eq("id", userCourseId)
    .eq("user_id", profile.id);

  return (
    <LearningClient
      userCourse={userCourse}
      videos={list}
      currentVideo={currentVideo}
      progressMap={progressMap}
      note={(note as Note | null) ?? null}
      timestampNotes={(stamps as TimestampNote[]) ?? []}
      resumeSeconds={resumeSeconds}
    />
  );
}
