import { z } from "zod";

export const saveNoteSchema = z.object({
  noteId: z.uuid().optional(),
  userCourseId: z.uuid(),
  courseVideoId: z.uuid().nullable().optional(),
  title: z.string().max(200).nullable().optional(),
  contentJson: z.record(z.string(), z.unknown()),
  contentText: z.string().max(200_000),
  contentHtml: z.string().max(400_000).optional().nullable(),
  tags: z.array(z.string().min(1).max(32)).max(20).optional(),
  isPinned: z.boolean().optional(),
});

export const timestampNoteSchema = z.object({
  userCourseId: z.uuid(),
  courseVideoId: z.uuid(),
  timestampSeconds: z.number().int().min(0),
  content: z.string().min(1).max(2000),
  noteId: z.uuid().optional().nullable(),
});
