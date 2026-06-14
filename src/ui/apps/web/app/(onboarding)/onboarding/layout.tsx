import type { Metadata } from "next";
import type { GetMyPlayerIdentityClaimResult } from "@globalscout/shared";
import { redirect } from "next/navigation";
import { OnboardingResumeGate } from "@/features/onboarding/player/onboarding-resume-gate";
import { createPlayerIdentityApi } from "@/lib/api/player-identity";
import { createServerApiClient } from "@/lib/api/server";
import { requireSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Player onboarding",
};

export default async function OnboardingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireSession();

  if (session.user.role !== "PLAYER" && session.user.role !== "PENDING") {
    redirect("/dashboard");
  }

  if (session.user.role === "PENDING") {
    return (
      <div className="flex min-h-screen flex-col">{children}</div>
    );
  }

  let claimResult: GetMyPlayerIdentityClaimResult;
  try {
    const client = await createServerApiClient();
    claimResult = await createPlayerIdentityApi(client).getMyClaim();
  } catch {
    claimResult = { status: "Unmatched", claim: null };
  }

  return (
    <OnboardingResumeGate claimResult={claimResult}>
      <div className="flex min-h-screen flex-col">{children}</div>
    </OnboardingResumeGate>
  );
}
