"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { addExistingCourseAction } from "@/actions/courses";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/locale-provider";

export function AddCourseButton({ courseId }: { courseId: string }) {
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await addExistingCourseAction(courseId);
          if (result.error) toast.error(result.error);
          else if (result.userCourseId) {
            toast.success(t.discover.addedToast);
            router.push(`/library/${result.userCourseId}`);
          }
        })
      }
    >
      {pending ? t.discover.adding : t.discover.addToLibrary}
    </Button>
  );
}
