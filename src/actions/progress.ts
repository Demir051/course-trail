"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/actions/auth";
import { requireUser } from "@/lib/auth";
import { toUserError } from "@/lib/errors";
import {
  calculateCourseProgressPercentage,
  calculateLessonCompletionPercentage,
  shouldAutoCompleteLesson,
} from "@/lib/progress";
import { createClient } from "@/lib/supabase/server";
import { saveProgressSchema } from "@/lib/validations/course";

export async function saveProgressAction(
  input: unknown,
): Promise<ActionResult & { completed?: boolean; progressPercentage?: number }> {
  const user = await requireUser();
  const parsed = saveProgressSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid progress." };
  }

  const {
    userCourseId,
    courseVideoId,
    lastTimestampSeconds,
    watchedDeltaSeconds,
    markCompleted,
    unmarkCompleted,
  } = parsed.data;

  const supabase = await createClient();

  const { data: enrollment } = await supabase
    .from("user_courses")
    .select("id, user_id, course_id, status, started_at")
    .eq("id", userCourseId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!enrollment) return { error: "Enrollment not found." };

  const { data: video } = await supabase
    .from("course_videos")
    .select("id, duration_seconds, course_id")
    .eq("id", courseVideoId)
    .maybeSingle();

  if (!video || video.course_id !== enrollment.course_id) {
    return { error: "Video not found for this course." };
  }

  const { data: existing } = await supabase
    .from("video_progress")
    .select("*")
    .eq("user_course_id", userCourseId)
    .eq("course_video_id", courseVideoId)
    .maybeSingle();

  const completionPercentage = calculateLessonCompletionPercentage(
    lastTimestampSeconds,
    video.duration_seconds,
  );

  let isCompleted = existing?.is_completed ?? false;
  if (unmarkCompleted) {
    isCompleted = false;
  } else if (markCompleted) {
    isCompleted = true;
  } else if (
    shouldAutoCompleteLesson(lastTimestampSeconds, video.duration_seconds)
  ) {
    isCompleted = true;
  }

  const watchedSeconds =
    (existing?.watched_seconds ?? 0) + (watchedDeltaSeconds ?? 0);

  const progressPayload = {
    user_id: user.id,
    user_course_id: userCourseId,
    course_video_id: courseVideoId,
    watched_seconds: watchedSeconds,
    last_timestamp_seconds: lastTimestampSeconds,
    completion_percentage: completionPercentage,
    is_completed: isCompleted,
    completed_at: isCompleted
      ? (existing?.completed_at ?? new Date().toISOString())
      : null,
  };

  const { error: progressError } = await supabase
    .from("video_progress")
    .upsert(progressPayload, { onConflict: "user_course_id,course_video_id" });

  if (progressError) {
    return {
      error: toUserError(progressError, "Could not save your progress."),
    };
  }

  const { count: completedCount } = await supabase
    .from("video_progress")
    .select("*", { count: "exact", head: true })
    .eq("user_course_id", userCourseId)
    .eq("is_completed", true);

  const { count: totalLessons } = await supabase
    .from("course_videos")
    .select("*", { count: "exact", head: true })
    .eq("course_id", enrollment.course_id);

  const progressPercentage = calculateCourseProgressPercentage(
    completedCount ?? 0,
    totalLessons ?? 0,
  );

  let status = enrollment.status;
  if (progressPercentage >= 100) {
    status = "completed";
  } else if (status === "want_to_learn" || status === "paused") {
    status = "in_progress";
  }

  const { error: courseError } = await supabase
    .from("user_courses")
    .update({
      current_video_id: courseVideoId,
      current_timestamp_seconds: lastTimestampSeconds,
      progress_percentage: progressPercentage,
      completed_lesson_count: completedCount ?? 0,
      last_opened_at: new Date().toISOString(),
      status,
      started_at: enrollment.started_at ?? new Date().toISOString(),
      completed_at:
        status === "completed" ? new Date().toISOString() : null,
    })
    .eq("id", userCourseId)
    .eq("user_id", user.id);

  if (courseError) {
    return {
      error: toUserError(courseError, "Could not save your progress."),
    };
  }

  // Private daily activity — never public
  const today = new Date().toISOString().slice(0, 10);
  const { data: day } = await supabase
    .from("learning_days")
    .select("id, watched_seconds, lessons_completed")
    .eq("user_id", user.id)
    .eq("activity_date", today)
    .maybeSingle();

  if (day) {
    await supabase
      .from("learning_days")
      .update({
        watched_seconds: day.watched_seconds + (watchedDeltaSeconds ?? 0),
        lessons_completed:
          day.lessons_completed +
          (isCompleted && !existing?.is_completed ? 1 : 0),
      })
      .eq("id", day.id);
  } else {
    await supabase.from("learning_days").insert({
      user_id: user.id,
      activity_date: today,
      watched_seconds: watchedDeltaSeconds ?? 0,
      lessons_completed: isCompleted && !existing?.is_completed ? 1 : 0,
    });
  }

  if (isCompleted && !existing?.is_completed) {
    await supabase.from("activities").insert({
      user_id: user.id,
      activity_type: "completed_lesson",
      course_id: enrollment.course_id,
      course_video_id: courseVideoId,
      visibility: "private",
    });
  }

  revalidatePath(`/library/${userCourseId}`);
  revalidatePath("/dashboard");
  revalidatePath(`/learn/${userCourseId}/${courseVideoId}`);

  return {
    success: "Progress saved.",
    completed: isCompleted,
    progressPercentage,
  };
}
