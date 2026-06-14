import type { Metadata } from "next";
import { AlertCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { ConnectIdentityCard } from "@/components/onboarding/connect-identity-card";
import { EmptyProfileSkeleton } from "@/components/onboarding/empty-profile-skeleton";
import { OnboardingHeader } from "@/components/onboarding/onboarding-header";
import { createPlayerIdentityApi } from "@/lib/api/player-identity";
import { createServerApiClient } from "@/lib/api/server";
import {
  DEFAULT_AUTHENTICATED_REDIRECT,
  ONBOARDING_ACCOUNT_TYPE_PATH,
  requireSession,
} from "@/lib/auth";

export const metadata: Metadata = {
  title: "Complete your profile",
};

export default async function EmptyProfilePage() {
  const session = await requireSession("/onboarding/player/empty-profile");

  if (session.user.role === "PENDING") {
    redirect(ONBOARDING_ACCOUNT_TYPE_PATH);
  }

  if (session.user.role !== "PLAYER") {
    redirect("/dashboard");
  }

  const client = await createServerApiClient();
  const claimResult = await createPlayerIdentityApi(client).getMyClaim();

  if (claimResult.status === "PendingVerification") {
    redirect("/onboarding/player/submitted");
  }

  if (claimResult.status === "Verified") {
    redirect(DEFAULT_AUTHENTICATED_REDIRECT);
  }

  if (claimResult.status === "Claimed") {
    redirect("/onboarding/player/claim");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <OnboardingHeader backHref="/onboarding/account-type" />

      <div className="mx-auto max-w-5xl px-4 py-10 md:px-8">
        <div className="mb-8 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm font-medium text-amber-800">
            Your profile is incomplete. Connect your football identity to get
            started.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2">
            <EmptyProfileSkeleton />
          </div>
          <ConnectIdentityCard
            connectHref="/onboarding/player/connect"
            skipHref="/dashboard"
          />
        </div>
      </div>
    </div>
  );
}
