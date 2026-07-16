"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { importPlaylistAction } from "@/actions/courses";
import type { ActionResult } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useT } from "@/i18n/locale-provider";

const initial: ActionResult & { userCourseId?: string } = {};

export function ImportPlaylistForm({
  autoFocus = false,
}: {
  autoFocus?: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const [state, action, pending] = useActionState(importPlaylistAction, initial);

  useEffect(() => {
    if (state.userCourseId) {
      router.push(`/library/${state.userCourseId}`);
    }
  }, [state.userCourseId, router]);

  return (
    <form action={action} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="input">{t.library.inputPlaceholder}</Label>
        <Input
          id="input"
          name="input"
          required
          autoFocus={autoFocus}
          placeholder="https://youtube.com/playlist?list=… or /watch?v=…"
        />
        <p className="text-xs text-muted-foreground">{t.library.inputHelp}</p>
      </div>
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {state.success ? (
        <Alert>
          <AlertDescription>{state.success}</AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? t.library.importing : t.library.importCourse}
      </Button>
    </form>
  );
}
