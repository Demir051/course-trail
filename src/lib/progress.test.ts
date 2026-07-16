import { describe, expect, it } from "vitest";
import {
  calculateCourseProgressPercentage,
  calculateLessonCompletionPercentage,
  resolveResumeTimestamp,
  shouldAutoCompleteLesson,
} from "@/lib/progress";

describe("progress helpers", () => {
  it("calculates lesson completion percentage", () => {
    expect(calculateLessonCompletionPercentage(45, 100)).toBe(45);
    expect(calculateLessonCompletionPercentage(120, 100)).toBe(100);
    expect(calculateLessonCompletionPercentage(10, 0)).toBe(0);
  });

  it("does not auto-complete after a few seconds", () => {
    expect(shouldAutoCompleteLesson(5, 600)).toBe(false);
    expect(shouldAutoCompleteLesson(540, 600)).toBe(true);
    expect(shouldAutoCompleteLesson(500, 600)).toBe(false);
  });

  it("calculates course progress from completed lessons", () => {
    expect(calculateCourseProgressPercentage(3, 10)).toBe(30);
    expect(calculateCourseProgressPercentage(0, 0)).toBe(0);
  });

  it("resets near-finished resume timestamps", () => {
    expect(resolveResumeTimestamp(598, 600)).toBe(0);
    expect(resolveResumeTimestamp(120, 600)).toBe(120);
    expect(resolveResumeTimestamp(0, 600)).toBe(0);
  });
});
