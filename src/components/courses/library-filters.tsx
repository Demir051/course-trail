"use client";

import { useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormSelect } from "@/components/ui/form-select";
import { useT } from "@/i18n/locale-provider";
import { cn } from "@/lib/utils";

export function LibraryFilters({
  q,
  status,
  sort,
  tag,
  knownTags = [],
}: {
  q?: string;
  status?: string;
  sort?: string;
  tag?: string;
  knownTags?: string[];
}) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  function update(next: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged = {
      q: q ?? "",
      status: status ?? "all",
      sort: sort ?? "recently_opened",
      tag: tag ?? "",
      ...next,
    };
    Object.entries(merged).forEach(([key, value]) => {
      if (
        value &&
        value !== "all" &&
        !(key === "sort" && value === "recently_opened")
      ) {
        params.set(key, value);
      }
    });
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div
      className="space-y-3 rounded-2xl border border-border/70 bg-card/50 p-4"
      aria-busy={pending}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
          <Label htmlFor="library-q">{t.common.search}</Label>
          <Input
            id="library-q"
            defaultValue={q}
            placeholder={`${t.common.search}…`}
            onChange={(e) => {
              const value = e.target.value;
              window.clearTimeout(
                (window as unknown as { __libT?: number }).__libT,
              );
              (window as unknown as { __libT?: number }).__libT =
                window.setTimeout(() => update({ q: value }), 300);
            }}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="library-status">{t.library.status}</Label>
          <FormSelect
            id="library-status"
            value={status ?? "all"}
            onValueChange={(value) => update({ status: value })}
            options={[
              { value: "all", label: t.status.all },
              { value: "want_to_learn", label: t.status.want_to_learn },
              { value: "in_progress", label: t.status.in_progress },
              { value: "paused", label: t.status.paused },
              { value: "completed", label: t.status.completed },
              { value: "dropped", label: t.status.dropped },
            ]}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="library-sort">{t.library.sort}</Label>
          <FormSelect
            id="library-sort"
            value={sort ?? "recently_opened"}
            onValueChange={(value) => update({ sort: value })}
            options={[
              { value: "recently_opened", label: t.sort.recently_opened },
              { value: "recently_added", label: t.sort.recently_added },
              { value: "progress", label: t.sort.progress },
              { value: "alphabetical", label: t.sort.alphabetical },
            ]}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="library-tag">{t.library.tag}</Label>
          <Input
            id="library-tag"
            defaultValue={tag}
            placeholder="react"
            onBlur={(e) => update({ tag: e.target.value.trim().toLowerCase() })}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                update({
                  tag: (e.target as HTMLInputElement).value
                    .trim()
                    .toLowerCase(),
                });
              }
            }}
          />
        </div>
      </div>

      {knownTags.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            {t.library.yourTags}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => update({ tag: "" })}
              className={cn(
                "min-h-9 rounded-full border px-3 py-1.5 text-xs transition",
                !tag
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/70 bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {t.library.allTags}
            </button>
            {knownTags.map((item) => {
              const active = tag === item;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => update({ tag: active ? "" : item })}
                  className={cn(
                    "min-h-9 rounded-full border px-3 py-1.5 text-xs transition",
                    active
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border/70 bg-card text-foreground hover:border-primary/40",
                  )}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
