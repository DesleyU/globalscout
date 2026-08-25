import { redirect } from "next/navigation";
import { StatsOnboardingPageClient } from "@/features/onboarding/player/stats-onboarding-page-client";
import { getSession } from "@/lib/auth";

export default async function StatsOnboardingPage() {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }

  const isPremium = session.user.accountType?.toLowerCase() === "premium";

  return <StatsOnboardingPageClient isPremium={isPremium} />;
}
