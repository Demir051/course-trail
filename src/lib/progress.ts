import { COMPLETION_THRESHOLD } from "@/lib/constants";

export function calculateLessonCompletionPercentage(
  lastTimestampSeconds: number,
  durationSeconds: number,
): number {
  if (durationSeconds <= 0) return 0;
  const pct = (lastTimestampSeconds / durationSeconds) * 100;
  return Math.min(100, Math.max(0, Number(pct.toFixed(2))));
}

export function shouldAutoCompleteLesson(
  lastTimestampSeconds: number,
  durationSeconds: number,
  threshold = COMPLETION_THRESHOLD,
): boolean {
  if (durationSeconds <= 0) return false;
  // Ignore tiny watches — a few seconds should never complete a lesson.
  if (lastTimestampSeconds < Math.min(30, durationSeconds * 0.05)) {
    return false;
  }
  return lastTimestampSeconds / durationSeconds >= threshold;
}

export function calculateCourseProgressPercentage(
  completedLessonCount: number,
  totalLessons: number,
): number {
  if (totalLessons <= 0) return 0;
  return Number(((completedLessonCount / totalLessons) * 100).toFixed(2));
}

export function resolveResumeTimestamp(
  savedSeconds: number,
  durationSeconds: number,
): number {
  if (savedSeconds <= 0) return 0;
  if (durationSeconds > 0 && savedSeconds >= durationSeconds - 2) {
    // Restart near-finished videos instead of ending immediately.
    return 0;
  }
  return Math.floor(savedSeconds);
}

export function nextLessonIndex(
  currentIndex: number,
  total: number,
): number | null {
  if (currentIndex < 0 || currentIndex >= total - 1) return null;
  return currentIndex + 1;
}
