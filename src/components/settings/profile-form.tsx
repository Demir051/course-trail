"use client";

import { useActionState } from "react";
import {
  updatePasswordAction,
  type ActionResult,
} from "@/actions/auth";
import { updateProfileAction } from "@/actions/profile";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AccountDangerZone } from "@/components/settings/account-danger-zone";
import { useT } from "@/i18n/locale-provider";
import type { Profile } from "@/types/database";

const initial: ActionResult = {};

export function ProfileSettingsForm({ profile }: { profile: Profile }) {
  const t = useT();
  const [state, action, pending] = useActionState(updateProfileAction, initial);
  const [pwState, pwAction, pwPending] = useActionState(
    updatePasswordAction,
    initial,
  );

  return (
    <div className="space-y-10">
      <form action={action} className="space-y-4 rounded-2xl border border-border/70 bg-card/60 p-5">
        <div className="space-y-2">
          <Label htmlFor="display_name">{t.settings.displayName}</Label>
          <Input
            id="display_name"
            name="display_name"
            defaultValue={profile.display_name ?? ""}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="username">{t.settings.username}</Label>
          <Input
            id="username"
            name="username"
            defaultValue={profile.username ?? ""}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bio">{t.settings.bio}</Label>
          <Textarea
            id="bio"
            name="bio"
            defaultValue={profile.bio ?? ""}
            maxLength={500}
            rows={4}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="website_url">{t.settings.website}</Label>
          <Input
            id="website_url"
            name="website_url"
            type="url"
            defaultValue={profile.website_url ?? ""}
            placeholder="https://"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="is_public"
            defaultChecked={profile.is_public}
            className="size-4 accent-[var(--primary)]"
          />
          {t.settings.publicEnabled}
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
          {pending ? t.common.saving : t.settings.saveProfile}
        </Button>
      </form>

      <form action={pwAction} className="space-y-4 rounded-2xl border border-border/70 bg-card/60 p-5">
        <h2 className="font-heading text-xl">{t.settings.password}</h2>
        <div className="space-y-2">
          <Label htmlFor="password">{t.settings.newPassword}</Label>
          <Input id="password" name="password" type="password" minLength={8} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">{t.settings.confirmPassword}</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            minLength={8}
            required
          />
        </div>
        {pwState.error ? (
          <Alert variant="destructive">
            <AlertDescription>{pwState.error}</AlertDescription>
          </Alert>
        ) : null}
        {pwState.success ? (
          <Alert>
            <AlertDescription>{pwState.success}</AlertDescription>
          </Alert>
        ) : null}
        <Button type="submit" disabled={pwPending}>
          {t.settings.updatePassword}
        </Button>
      </form>

      <AccountDangerZone />
    </div>
  );
}
