import { LandingPage } from "@/components/landing/landing-page";
import { getCurrentProfile } from "@/lib/auth";

export default async function HomePage() {
  const profile = await getCurrentProfile();
  return <LandingPage profile={profile} />;
}
