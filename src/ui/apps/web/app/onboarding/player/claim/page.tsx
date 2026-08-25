import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ClaimPageClient } from "@/features/onboarding/player/claim-page-client";
import { createPlayerIdentityApi } from "@/lib/api/player-identity";
import { createServerApiClient } from "@/lib/api/server";
import { requireSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Claim profile",
};

export default async function ClaimPage() {
  const session = await requireSession("/onboarding/player/claim");
  const client = await createServerApiClient();
  const claimResult = await createPlayerIdentityApi(client).getMyClaim();

  if (claimResult.status === "PendingVerification") {
    redirect("/onboarding/player/submitted");
  }

  if (claimResult.status === "Verified") {
    redirect("/dashboard");
  }

  const userFullName = [
    (session.user.profile as { firstName?: string } | null | undefined)
      ?.firstName,
    (session.user.profile as { lastName?: string } | null | undefined)?.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <ClaimPageClient
      initialClaim={claimResult.claim}
      userFullName={userFullName || session.user.email}
    />
  );
}
