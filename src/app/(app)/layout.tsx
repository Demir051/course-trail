import { SiteHeader } from "@/components/layout/site-header";
import { requireProfile } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader profile={profile} variant="app" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-3 py-5 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
