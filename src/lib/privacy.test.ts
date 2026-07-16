import { describe, expect, it } from "vitest";
import {
  isEnrollmentPubliclyVisible,
  toPublicUserCourse,
} from "@/lib/privacy";
import type { UserCourse } from "@/types/database";

describe("privacy helpers", () => {
  it("keeps private enrollments hidden", () => {
    expect(
      isEnrollmentPubliclyVisible({
        visibility: "private",
        status: "completed",
      }),
    ).toBe(false);
  });

  it("shows public_on_completion only when completed", () => {
    expect(
      isEnrollmentPubliclyVisible({
        visibility: "public_on_completion",
        status: "in_progress",
      }),
    ).toBe(false);
    expect(
      isEnrollmentPubliclyVisible({
        visibility: "public_on_completion",
        status: "completed",
      }),
    ).toBe(true);
  });

  it("strips exact progress fields from public payloads", () => {
    const publicCourse = toPublicUserCourse({
      id: "uc1",
      user_id: "u1",
      course_id: "c1",
      status: "in_progress",
      visibility: "public",
      rating: 4,
      personal_tags: ["secret-tag"],
      course_notes_json: null,
      course_notes_text: null,
      is_archived: false,
      started_at: null,
      completed_at: null,
      last_opened_at: null,
      current_video_id: "should-not-leak",
      current_timestamp_seconds: 999,
      progress_percentage: 42.2,
      completed_lesson_count: 2,
      created_at: "2026-01-01",
      updated_at: "2026-01-01",
    } satisfies UserCourse);

    expect(publicCourse).not.toHaveProperty("current_video_id");
    expect(publicCourse).not.toHaveProperty("current_timestamp_seconds");
    expect(publicCourse).not.toHaveProperty("personal_tags");
    expect(publicCourse.progress_percentage).toBe(42);
  });
});
