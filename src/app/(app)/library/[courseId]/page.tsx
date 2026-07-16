import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Circle } from "lucide-react";
import { CourseProgress } from "@/components/courses/course-progress";
import { CourseSettings } from "@/components/courses/course-settings";
import { StatusBadge } from "@/components/courses/status-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getDictionary } from "@/i18n/dictionaries";
import { requireOnboardedProfile } from "@/lib/auth";
import { getRequestLocale } from "@/lib/locale-server";
import { collectUserTags } from "@/lib/tags";
import { createClient } from "@/lib/supabase/server";
import { formatDuration } from "@/lib/youtube/duration";
import type {
  Course,
  CourseVideo,
  Note,
  UserCourse,
  VideoProgress,
} from "@/types/database";

export const metadata = { title: "Course" };

export default async function LibraryCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const profile = await requireOnboardedProfile();
  const t = getDictionary(await getRequestLocale());
  const { courseId } = await params;
  const supabase = await createClient();

  // route param is userCourseId in product routes; keep alias for clarity
  const { data: enrollment } = await supabase
    .from("user_courses")
    .select("*, course:courses(*)")
    .eq("id", courseId)
    .eq("user_id", profile.id)
    .maybeSingle();

  if (!enrollment) notFound();
  const userCourse = enrollment as UserCourse & { course: Course };
  const course = userCourse.course;

  const { data: videos } = await supabase
    .from("course_videos")
    .select("*")
    .eq("course_id", course.id)
    .order("playlist_position", { ascending: true });

  const { data: tagRows } = await supabase
    .from("user_courses")
    .select("personal_tags")
    .eq("user_id", profile.id);

  const knownTags = collectUserTags(tagRows ?? []);

  const { data: progressRows } = await supabase
    .from("video_progress")
    .select("*")
    .eq("user_course_id", userCourse.id);

  const { data: notes } = await supabase
    .from("notes")
    .select("id, course_video_id")
    .eq("user_course_id", userCourse.id)
    .eq("user_id", profile.id);

  const progressMap = Object.fromEntries(
    ((progressRows ?? []) as VideoProgress[]).map((p) => [p.course_video_id, p]),
  );
  const noteCountByVideo = ((notes ?? []) as Pick<Note, "id" | "course_video_id">[]).reduce(
    (acc, note) => {
      if (!note.course_video_id) return acc;
      acc[note.course_video_id] = (acc[note.course_video_id] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const list = (videos ?? []) as CourseVideo[];
  const continueVideoId =
    userCourse.current_video_id ??
    list.find((v) => !progressMap[v.id]?.is_completed)?.id ??
    list[0]?.id;

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="relative aspect-video overflow-hidden rounded-2xl bg-muted lg:aspect-[4/3]">
          {course.thumbnail_url ? (
            <Image
              src={course.thumbnail_url}
              alt=""
              fill
              className="object-cover"
              sizes="280px"
              priority
            />
          ) : null}
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <StatusBadge status={userCourse.status} />
            <h1 className="font-heading text-3xl tracking-tight">
              {course.title}
            </h1>
            <p className="text-muted-foreground">
              {course.youtube_channel_name} · {course.video_count}{" "}
              {t.common.lessons} ·{" "}
              {formatDuration(course.total_duration_seconds)}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                {userCourse.completed_lesson_count}/{course.video_count}{" "}
                {t.library.completedOf}
              </span>
              <span>{Math.round(Number(userCourse.progress_percentage))}%</span>
            </div>
            <CourseProgress value={Number(userCourse.progress_percentage)} />
          </div>
          {continueVideoId ? (
            <Button
              size="lg"
              render={
                <Link href={`/learn/${userCourse.id}/${continueVideoId}`} />
              }
            >
              {t.dashboard.continueLearning}
            </Button>
          ) : null}
          {course.description ? (
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {course.description}
            </p>
          ) : null}
        </div>
      </div>

      <CourseSettings
        userCourse={userCourse}
        courseId={course.id}
        knownTags={knownTags}
      />

      <section className="space-y-3">
        <h2 className="font-heading text-2xl">{t.common.lessonsTitle}</h2>
        <ol className="divide-y divide-border/60 rounded-2xl border border-border/70 bg-card/50">
          {list.map((video, index) => {
            const done = progressMap[video.id]?.is_completed;
            const isCurrent = userCourse.current_video_id === video.id;
            const noteCount = noteCountByVideo[video.id] ?? 0;
            return (
              <li key={video.id}>
                <Link
                  href={`/learn/${userCourse.id}/${video.id}`}
                  className={`flex min-h-14 items-center gap-3 px-3 py-3 transition hover:bg-muted/40 sm:px-4 ${
                    isCurrent ? "bg-primary/5" : ""
                  }`}
                >
                  <span className="w-5 shrink-0 text-sm text-muted-foreground sm:w-6">
                    {index + 1}
                  </span>
                  <span className="relative hidden size-14 overflow-hidden rounded-lg bg-muted sm:block">
                    {video.thumbnail_url ? (
                      <Image
                        src={video.thumbnail_url}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2 font-medium">
                      {done ? (
                        <CheckCircle2 className="size-4 shrink-0 text-primary" />
                      ) : (
                        <Circle className="size-4 shrink-0 text-muted-foreground" />
                      )}
                      <span className="min-w-0 break-words sm:truncate">
                        {video.title}
                      </span>
                      {isCurrent ? (
                        <Badge variant="outline" className="shrink-0">
                          {t.common.current}
                        </Badge>
                      ) : null}
                      {!video.is_available ? (
                        <Badge variant="destructive" className="shrink-0">
                          {t.common.unavailable}
                        </Badge>
                      ) : null}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {formatDuration(video.duration_seconds)}
                      {noteCount > 0
                        ? ` · ${noteCount} ${t.common.notes}`
                        : ""}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
