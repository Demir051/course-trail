"use client";

import { useT } from "@/i18n/locale-provider";
import { cn } from "@/lib/utils";
import type { CourseStatus } from "@/types/database";

const STATUS_STYLES: Record<CourseStatus, string> = {
  want_to_learn:
    "border-sky-500/30 bg-sky-500/15 text-sky-800 dark:text-sky-200",
  in_progress:
    "border-amber-500/35 bg-amber-500/15 text-amber-900 dark:text-amber-200",
  paused:
    "border-violet-500/30 bg-violet-500/15 text-violet-800 dark:text-violet-200",
  completed:
    "border-emerald-500/35 bg-emerald-500/15 text-emerald-900 dark:text-emerald-200",
  dropped:
    "border-rose-500/30 bg-rose-500/15 text-rose-800 dark:text-rose-200",
};

const STATUS_DOT: Record<CourseStatus, string> = {
  want_to_learn: "bg-sky-500",
  in_progress: "bg-amber-500 animate-pulse",
  paused: "bg-violet-500",
  completed: "bg-emerald-500",
  dropped: "bg-rose-500",
};

export function StatusBadge({
  status,
  className,
}: {
  status: CourseStatus;
  className?: string;
}) {
  const t = useT();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        STATUS_STYLES[status],
        className,
      )}
    >
      <span
        className={cn("size-1.5 shrink-0 rounded-full", STATUS_DOT[status])}
        aria-hidden
      />
      {t.status[status]}
    </span>
  );
}

export function progressTone(percentage: number): string {
  if (percentage >= 100) return "bg-emerald-500";
  if (percentage >= 60) return "bg-teal-500";
  if (percentage >= 25) return "bg-amber-500";
  return "bg-sky-500";
}
