"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/i18n/locale-provider";
import { normalizeTag, uniqueTags } from "@/lib/tags";
import { cn } from "@/lib/utils";

type TagPickerProps = {
  value: string[];
  knownTags: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
  label?: string;
};

export function TagPicker({
  value,
  knownTags,
  onChange,
  disabled,
  label,
}: TagPickerProps) {
  const t = useT();
  const resolvedLabel = label ?? t.library.personalTags;
  const [draft, setDraft] = useState("");

  const selected = useMemo(() => uniqueTags(value), [value]);
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const suggestions = useMemo(
    () =>
      uniqueTags(knownTags)
        .filter((tag) => !selectedSet.has(tag))
        .sort((a, b) => a.localeCompare(b)),
    [knownTags, selectedSet],
  );

  function commitDraft() {
    const parts = draft
      .split(/[,]/)
      .map(normalizeTag)
      .filter(Boolean);
    if (parts.length === 0) return;
    onChange(uniqueTags([...selected, ...parts]));
    setDraft("");
  }

  function toggleTag(tag: string) {
    const normalized = normalizeTag(tag);
    if (!normalized) return;
    if (selectedSet.has(normalized)) {
      onChange(selected.filter((item) => item !== normalized));
    } else {
      onChange(uniqueTags([...selected, normalized]));
    }
  }

  return (
    <div className="space-y-3 sm:col-span-2">
      <div className="space-y-1.5">
        <Label htmlFor="tag-input">{resolvedLabel}</Label>
        <Input
          id="tag-input"
          value={draft}
          disabled={disabled}
          placeholder={t.tags.placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              commitDraft();
            }
            if (e.key === "Backspace" && !draft && selected.length > 0) {
              onChange(selected.slice(0, -1));
            }
          }}
          onBlur={() => {
            if (draft.trim()) commitDraft();
          }}
        />
        <p className="text-xs text-muted-foreground">{t.tags.help}</p>
      </div>

      {selected.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            {t.tags.onThisCourse}
          </p>
          <div className="flex flex-wrap gap-2">
            {selected.map((tag) => (
              <button
                key={tag}
                type="button"
                disabled={disabled}
                onClick={() => toggleTag(tag)}
                className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition hover:bg-primary/15"
              >
                {tag}
                <X className="size-3 opacity-70" aria-hidden />
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {suggestions.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            {t.tags.yours}
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((tag) => (
              <button
                key={tag}
                type="button"
                disabled={disabled}
                onClick={() => toggleTag(tag)}
                className={cn(
                  "rounded-full border border-border/70 bg-card px-2.5 py-1 text-xs text-foreground transition hover:border-primary/40 hover:bg-primary/5",
                )}
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
