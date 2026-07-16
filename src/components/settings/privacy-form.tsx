"use client";

import { useActionState } from "react";
import type { ActionResult } from "@/actions/auth";
import { updatePrivacySettingsAction } from "@/actions/profile";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/locale-provider";
import type { Profile } from "@/types/database";

const initial: ActionResult = {};

export function PrivacySettingsForm({ profile }: { profile: Profile }) {
  const t = useT();
  const [state, action, pending] = useActionState(
    updatePrivacySettingsAction,
    initial,
  );

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-border/70 bg-card/60 p-5">
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          name="is_public"
          defaultChecked={profile.is_public}
          className="mt-0.5 size-4 accent-[var(--primary)]"
        />
        <span>
          <span className="font-medium text-foreground">
            {t.settings.publicProfile}
          </span>
          <span className="mt-1 block text-muted-foreground">
            {t.settings.publicProfileHelp.replace(
              "{username}",
              profile.username ?? "",
            )}
          </span>
        </span>
      </label>
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
        {t.settings.savePrivacy}
      </Button>
    </form>
  );
}
