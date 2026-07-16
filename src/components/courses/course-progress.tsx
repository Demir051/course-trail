"use client";

import { progressTone } from "@/components/courses/status-badge";
import { cn } from "@/lib/utils";

export function CourseProgress({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const pct = Math.min(100, Math.max(0, Number(value) || 0));
  return (
    <div
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-muted",
        className,
      )}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500 ease-out",
          progressTone(pct),
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
