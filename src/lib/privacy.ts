import type { CourseStatus, CourseVisibility, UserCourse } from "@/types/database";

export function isEnrollmentPubliclyVisible(input: {
  visibility: CourseVisibility;
  status: CourseStatus;
}): boolean {
  if (input.visibility === "public") return true;
  if (input.visibility === "public_on_completion" && input.status === "completed") {
    return true;
  }
  return false;
}

/** Strip private progress fields before any public serialization. */
export function toPublicUserCourse<T extends UserCourse>(uc: T) {
  return {
    id: uc.id,
    status: uc.status,
    visibility: uc.visibility,
    rating: uc.rating,
    progress_percentage: Math.round(Number(uc.progress_percentage)),
    completed_lesson_count: uc.completed_lesson_count,
    completed_at: uc.completed_at,
    created_at: uc.created_at,
    course: uc.course
      ? {
          id: uc.course.id,
          title: uc.course.title,
          thumbnail_url: uc.course.thumbnail_url,
          youtube_channel_name: uc.course.youtube_channel_name,
          video_count: uc.course.video_count,
          total_duration_seconds: uc.course.total_duration_seconds,
        }
      : undefined,
  };
}

export const PUBLIC_USER_COURSE_SELECT = `
  id,
  status,
  visibility,
  rating,
  progress_percentage,
  completed_lesson_count,
  completed_at,
  created_at,
  course:courses (
    id,
    title,
    thumbnail_url,
    youtube_channel_name,
    video_count,
    total_duration_seconds
  )
`;
