"use client";

import { useState } from "react";
import { toast } from "sonner";
import { deleteNoteAction, saveNoteAction } from "@/actions/notes";
import { RichTextEditor } from "@/components/notes/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/i18n/locale-provider";
import type { Note } from "@/types/database";
import { useRouter } from "next/navigation";

export function NoteEditor({ note }: { note: Note }) {
  const t = useT();
  const router = useRouter();
  const [title, setTitle] = useState(note.title ?? "");
  const [pinned, setPinned] = useState(note.is_pinned);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-0 w-full flex-1 space-y-1.5">
          <Label htmlFor="title">{t.notesPage.titleLabel}</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="min-h-10"
            onBlur={async () => {
              const result = await saveNoteAction({
                noteId: note.id,
                userCourseId: note.user_course_id,
                courseVideoId: note.course_video_id,
                title,
                contentJson: note.content_json,
                contentText: note.content_text,
                isPinned: pinned,
              });
              if (result.error) toast.error(result.error);
            }}
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Button
            type="button"
            variant={pinned ? "secondary" : "outline"}
            className="min-h-10"
            onClick={async () => {
              const next = !pinned;
              setPinned(next);
              await saveNoteAction({
                noteId: note.id,
                userCourseId: note.user_course_id,
                courseVideoId: note.course_video_id,
                title,
                contentJson: note.content_json,
                contentText: note.content_text,
                isPinned: next,
              });
            }}
          >
            {pinned ? t.common.pinned : t.notesPage.pin}
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="min-h-10"
            onClick={async () => {
              const result = await deleteNoteAction(note.id);
              if (result.error) toast.error(result.error);
              else router.push("/notes");
            }}
          >
            {t.common.delete}
          </Button>
        </div>
      </div>
      <RichTextEditor
        initialJson={note.content_json}
        onSave={async (payload) => {
          const result = await saveNoteAction({
            noteId: note.id,
            userCourseId: note.user_course_id,
            courseVideoId: note.course_video_id,
            title,
            contentJson: payload.contentJson,
            contentText: payload.contentText,
            contentHtml: payload.contentHtml,
            isPinned: pinned,
          });
          return !result.error;
        }}
      />
    </div>
  );
}
