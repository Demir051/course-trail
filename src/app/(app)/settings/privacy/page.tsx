import { PrivacySettingsForm } from "@/components/settings/privacy-form";
import { SettingsNav } from "@/components/settings/settings-nav";
import { getDictionary } from "@/i18n/dictionaries";
import { requireOnboardedProfile } from "@/lib/auth";
import { getRequestLocale } from "@/lib/locale-server";

export const metadata = { title: "Privacy settings" };

export default async function PrivacySettingsPage() {
  const profile = await requireOnboardedProfile();
  const t = getDictionary(await getRequestLocale());
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl tracking-tight sm:text-3xl">
          {t.settings.privacyTitle}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          {t.settings.privacyBody}
        </p>
      </div>
      <SettingsNav />
      <PrivacySettingsForm profile={profile} />
    </div>
  );
}
