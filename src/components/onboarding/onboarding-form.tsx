"use client";

import { useActionState, useState } from "react";
import { completeOnboardingAction } from "@/actions/profile";
import type { ActionResult } from "@/actions/auth";
import { INTEREST_OPTIONS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useT } from "@/i18n/locale-provider";

const initial: ActionResult = {};

export function OnboardingForm({
  defaultDisplayName,
}: {
  defaultDisplayName?: string | null;
}) {
  const t = useT();
  const [state, action, pending] = useActionState(
    completeOnboardingAction,
    initial,
  );
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState(defaultDisplayName ?? "");
  const [username, setUsername] = useState("");

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="displayName" value={displayName} />
      <input type="hidden" name="username" value={username} />

      {step === 1 ? (
        <div className="space-y-4">
          <div>
            <h1 className="font-heading text-3xl tracking-tight">
              {t.onboarding.title}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {t.onboarding.subtitle}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="displayName">{t.onboarding.displayName}</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">{t.onboarding.username}</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              required
              pattern="[a-z0-9_]{3,24}"
              placeholder="alex_learns"
              autoComplete="username"
            />
            <p className="text-xs text-muted-foreground">
              {t.onboarding.usernameHelp}
            </p>
          </div>
          <Button
            type="button"
            onClick={() => {
              if (displayName.trim() && /^[a-z0-9_]{3,24}$/.test(username)) {
                setStep(2);
              }
            }}
          >
            {t.onboarding.continue}
          </Button>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          <div>
            <h1 className="font-heading text-3xl tracking-tight">
              {t.onboarding.interestsTitle}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {t.onboarding.interestsHelp}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {INTEREST_OPTIONS.map((interest) => (
              <label
                key={interest}
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-border/70 bg-card/60 px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  name="interests"
                  value={interest}
                  className="size-4 rounded border-input accent-[var(--primary)]"
                />
                {t.interests[interest as keyof typeof t.interests] ?? interest}
              </label>
            ))}
          </div>
          <div className="rounded-xl border border-border/70 bg-muted/40 p-4 text-sm text-muted-foreground">
            {t.onboarding.privacyNote}
          </div>
          {state.error ? (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="ghost" onClick={() => setStep(1)}>
              {t.common.back}
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? t.common.saving : t.onboarding.importFirst}
            </Button>
            <Button
              type="submit"
              name="skip"
              value="1"
              variant="outline"
              disabled={pending}
            >
              {t.onboarding.skip}
            </Button>
          </div>
        </div>
      ) : null}
    </form>
  );
}
