import { ProfileSettingsForm } from "@/components/settings/profile-form";
import { SettingsNav } from "@/components/settings/settings-nav";
import { getDictionary } from "@/i18n/dictionaries";
import { requireOnboardedProfile } from "@/lib/auth";
import { getRequestLocale } from "@/lib/locale-server";

export const metadata = { title: "Profile settings" };

export default async function ProfileSettingsPage() {
  const profile = await requireOnboardedProfile();
  const t = getDictionary(await getRequestLocale());
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl tracking-tight sm:text-3xl">
          {t.settings.profileTitle}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          {t.settings.profileBody}
        </p>
      </div>
      <SettingsNav />
      <ProfileSettingsForm profile={profile} />
    </div>
  );
}
