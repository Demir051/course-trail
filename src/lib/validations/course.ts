import { z } from "zod";

export const importPlaylistSchema = z.object({
  input: z.string().min(1, "Paste a YouTube playlist or video URL."),
});

export const updateUserCourseSchema = z.object({
  userCourseId: z.uuid(),
  status: z
    .enum(["want_to_learn", "in_progress", "paused", "completed", "dropped"])
    .optional(),
  visibility: z
    .enum(["private", "public", "public_on_completion"])
    .optional(),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  personal_tags: z.array(z.string().min(1).max(32)).max(20).optional(),
  is_archived: z.boolean().optional(),
});

export const saveProgressSchema = z.object({
  userCourseId: z.uuid(),
  courseVideoId: z.uuid(),
  lastTimestampSeconds: z.number().int().min(0),
  watchedDeltaSeconds: z.number().int().min(0).max(120).default(0),
  markCompleted: z.boolean().optional(),
  unmarkCompleted: z.boolean().optional(),
});

export const libraryFilterSchema = z.object({
  q: z.string().optional(),
  status: z
    .enum([
      "all",
      "want_to_learn",
      "in_progress",
      "paused",
      "completed",
      "dropped",
    ])
    .default("all"),
  sort: z
    .enum([
      "recently_opened",
      "recently_added",
      "progress",
      "alphabetical",
    ])
    .default("recently_opened"),
  tag: z.string().optional(),
  archived: z.boolean().default(false),
});
