"use server";

import DOMPurify from "isomorphic-dompurify";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/actions/auth";
import { getT } from "@/i18n/server-t";
import { requireUser } from "@/lib/auth";
import { toUserError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { saveNoteSchema, timestampNoteSchema } from "@/lib/validations/notes";

export async function saveNoteAction(
  input: unknown,
): Promise<ActionResult & { noteId?: string }> {
  const user = await requireUser();
  const parsed = saveNoteSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid note." };
  }

  const supabase = await createClient();
  const {
    noteId,
    userCourseId,
    courseVideoId,
    title,
    contentJson,
    contentText,
    contentHtml,
    tags,
    isPinned,
  } = parsed.data;

  const { data: enrollment } = await supabase
    .from("user_courses")
    .select("id")
    .eq("id", userCourseId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!enrollment) return { error: "Course not found." };

  const sanitizedHtml = contentHtml
    ? DOMPurify.sanitize(contentHtml, {
        USE_PROFILES: { html: true },
      })
    : null;

  if (noteId) {
    const { data, error } = await supabase
      .from("notes")
      .update({
        title: title ?? null,
        content_json: contentJson,
        content_text: contentText,
        content_html: sanitizedHtml,
        tags: tags ?? [],
        is_pinned: isPinned ?? false,
        course_video_id: courseVideoId ?? null,
      })
      .eq("id", noteId)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();

    if (error) {
      return { error: toUserError(error, "Could not save your note.") };
    }
    if (!data) return { error: "Note not found." };
    revalidatePath("/notes");
    return { success: (await getT()).messages.noteSaved, noteId: data.id };
  }

  const { data, error } = await supabase
    .from("notes")
    .insert({
      user_id: user.id,
      user_course_id: userCourseId,
      course_video_id: courseVideoId ?? null,
      title: title ?? null,
      content_json: contentJson,
      content_text: contentText,
      content_html: sanitizedHtml,
      tags: tags ?? [],
      is_pinned: isPinned ?? false,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: toUserError(error, "Could not save your note.") };
  }
  revalidatePath("/notes");
  return { success: (await getT()).messages.noteCreated, noteId: data.id };
}

export async function createTimestampNoteAction(
  input: unknown,
): Promise<ActionResult & { id?: string }> {
  const user = await requireUser();
  const parsed = timestampNoteSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid timestamp note." };
  }

  const supabase = await createClient();
  const { data: enrollment } = await supabase
    .from("user_courses")
    .select("id")
    .eq("id", parsed.data.userCourseId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!enrollment) return { error: "Course not found." };

  const { data, error } = await supabase
    .from("timestamp_notes")
    .insert({
      user_id: user.id,
      user_course_id: parsed.data.userCourseId,
      course_video_id: parsed.data.courseVideoId,
      timestamp_seconds: parsed.data.timestampSeconds,
      content: parsed.data.content,
      note_id: parsed.data.noteId ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      error: toUserError(error, "Could not save that timestamp note."),
    };
  }

  revalidatePath(`/learn/${parsed.data.userCourseId}/${parsed.data.courseVideoId}`);
  return { success: (await getT()).messages.stampAdded, id: data.id };
}

export async function deleteTimestampNoteAction(
  id: string,
): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("timestamp_notes")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: toUserError(error, "Could not delete that note.") };
  }
  return { success: (await getT()).messages.deleted };
}

export async function deleteNoteAction(noteId: string): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("notes")
    .delete()
    .eq("id", noteId)
    .eq("user_id", user.id);

  if (error) {
    return { error: toUserError(error, "Could not delete that note.") };
  }
  revalidatePath("/notes");
  return { success: (await getT()).messages.noteDeleted };
}

export async function exportCourseNotesMarkdown(
  userCourseId: string,
): Promise<{ markdown?: string; error?: string }> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: enrollment } = await supabase
    .from("user_courses")
    .select("id, course:courses(title)")
    .eq("id", userCourseId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!enrollment) return { error: "Course not found." };

  const { data: notes } = await supabase
    .from("notes")
    .select("title, content_text, course_video_id, is_pinned, updated_at")
    .eq("user_course_id", userCourseId)
    .eq("user_id", user.id)
    .order("is_pinned", { ascending: false })
    .order("updated_at", { ascending: false });

  const { data: stamps } = await supabase
    .from("timestamp_notes")
    .select("timestamp_seconds, content, course_video_id")
    .eq("user_course_id", userCourseId)
    .eq("user_id", user.id)
    .order("timestamp_seconds", { ascending: true });

  const courseTitle =
    (enrollment.course as unknown as { title?: string } | null)?.title ??
    "Course notes";

  const lines = [`# ${courseTitle}`, ""];

  for (const note of notes ?? []) {
    lines.push(`## ${note.title || "Untitled note"}`);
    lines.push("");
    lines.push(note.content_text || "_Empty note_");
    lines.push("");
  }

  if ((stamps ?? []).length > 0) {
    lines.push("## Timestamp notes");
    lines.push("");
    for (const stamp of stamps ?? []) {
      const m = Math.floor(stamp.timestamp_seconds / 60);
      const s = stamp.timestamp_seconds % 60;
      lines.push(
        `- ${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")} — ${stamp.content}`,
      );
    }
  }

  return { markdown: lines.join("\n") };
}
