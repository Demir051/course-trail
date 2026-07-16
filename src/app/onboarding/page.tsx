import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { SiteHeader } from "@/components/layout/site-header";
import { requireProfile } from "@/lib/auth";

export const metadata = { title: "Onboarding" };

export default async function OnboardingPage() {
  const profile = await requireProfile();
  if (profile.onboarding_completed && profile.username) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader profile={profile} variant="app" />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-12 sm:px-6">
        <OnboardingForm defaultDisplayName={profile.display_name} />
      </main>
    </div>
  );
}
