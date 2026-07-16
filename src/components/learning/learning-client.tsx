"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { ComponentProps } from "react";

const LearningWorkspace = dynamic(
  () =>
    import("@/components/learning/learning-workspace").then(
      (m) => m.LearningWorkspace,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="aspect-video w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    ),
  },
);

export function LearningClient(
  props: ComponentProps<typeof LearningWorkspace>,
) {
  return <LearningWorkspace {...props} />;
}
