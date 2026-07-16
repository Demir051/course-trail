"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { useEffect, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  Code,
  Heading2,
  Heading3,
  Link2,
  Minus,
  Redo2,
  Undo2,
  Table as TableIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/locale-provider";
import { NOTES_AUTOSAVE_DEBOUNCE_MS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type SaveState = "idle" | "saving" | "saved" | "failed";

type RichTextEditorProps = {
  initialJson?: Record<string, unknown> | null;
  placeholder?: string;
  onSave: (payload: {
    contentJson: Record<string, unknown>;
    contentText: string;
    contentHtml: string;
  }) => Promise<boolean>;
  className?: string;
};

export function RichTextEditor({
  initialJson,
  placeholder,
  onSave,
  className,
}: RichTextEditorProps) {
  const t = useT();
  const resolvedPlaceholder = placeholder ?? t.notesPage.writePlaceholder;
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const saveTimer = useRef<number | null>(null);
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: resolvedPlaceholder }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: initialJson ?? { type: "doc", content: [{ type: "paragraph" }] },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none px-3 py-3 focus:outline-none min-h-[12rem]",
      },
    },
    onUpdate: ({ editor: ed }) => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      setSaveState("saving");
      saveTimer.current = window.setTimeout(() => {
        void (async () => {
          try {
            const ok = await onSaveRef.current({
              contentJson: ed.getJSON() as Record<string, unknown>,
              contentText: ed.getText(),
              contentHtml: ed.getHTML(),
            });
            setSaveState(ok ? "saved" : "failed");
          } catch {
            setSaveState("failed");
          }
        })();
      }, NOTES_AUTOSAVE_DEBOUNCE_MS);
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, []);

  if (!editor) return null;

  function ToolbarButton({
    onClick,
    active,
    label,
    children,
  }: {
    onClick: () => void;
    active?: boolean;
    label: string;
    children: React.ReactNode;
  }) {
    return (
      <Button
        type="button"
        size="icon"
        variant={active ? "secondary" : "ghost"}
        className="size-9 shrink-0 sm:size-8"
        aria-label={label}
        aria-pressed={active}
        onClick={onClick}
      >
        {children}
      </Button>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border/70 bg-card/70",
        className,
      )}
    >
      <div className="flex items-center gap-0.5 overflow-x-auto border-b border-border/60 p-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ToolbarButton
          label="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic />
        </ToolbarButton>
        <ToolbarButton
          label="Underline"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon />
        </ToolbarButton>
        <ToolbarButton
          label="Strikethrough"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough />
        </ToolbarButton>
        <ToolbarButton
          label="Heading 2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Heading2 />
        </ToolbarButton>
        <ToolbarButton
          label="Heading 3"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
        >
          <Heading3 />
        </ToolbarButton>
        <ToolbarButton
          label="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List />
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered />
        </ToolbarButton>
        <ToolbarButton
          label="Checklist"
          active={editor.isActive("taskList")}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
        >
          <ListTodo />
        </ToolbarButton>
        <ToolbarButton
          label="Quote"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote />
        </ToolbarButton>
        <ToolbarButton
          label="Code block"
          active={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <Code />
        </ToolbarButton>
        <ToolbarButton
          label="Horizontal rule"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus />
        </ToolbarButton>
        <ToolbarButton
          label="Insert table"
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
        >
          <TableIcon />
        </ToolbarButton>
        <ToolbarButton
          label="Add link"
          onClick={() => {
            const raw = window.prompt("Link URL (https://…)");
            if (!raw) return;
            const trimmed = raw.trim();
            let href = trimmed;
            if (!/^https?:\/\//i.test(trimmed) && !trimmed.startsWith("mailto:")) {
              href = `https://${trimmed}`;
            }
            try {
              const parsed = new URL(href);
              if (
                parsed.protocol !== "http:" &&
                parsed.protocol !== "https:" &&
                parsed.protocol !== "mailto:"
              ) {
                return;
              }
              editor
                .chain()
                .focus()
                .extendMarkRange("link")
                .setLink({ href: parsed.toString() })
                .run();
            } catch {
              // ignore invalid URLs
            }
          }}
        >
          <Link2 />
        </ToolbarButton>
        <ToolbarButton
          label="Undo"
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 />
        </ToolbarButton>
        <ToolbarButton
          label="Redo"
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 />
        </ToolbarButton>
        <span
          className="ml-auto shrink-0 whitespace-nowrap px-2 text-xs text-muted-foreground"
          aria-live="polite"
        >
          {saveState === "saving" && t.common.saving}
          {saveState === "saved" && t.common.saved}
          {saveState === "failed" && t.notesPage.saveFailed}
          {saveState === "idle" && t.notesPage.autosave}
        </span>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
