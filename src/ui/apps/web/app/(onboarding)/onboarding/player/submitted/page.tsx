import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Check } from "lucide-react";
import { SubmittedInfoCard } from "@/components/onboarding/submitted-info-card";
import { VerificationTimeline } from "@/components/onboarding/verification-timeline";
import { Button } from "@/components/ui/button";
import { createPlayerIdentityApi } from "@/lib/api/player-identity";
import { createServerApiClient } from "@/lib/api/server";
import { ONBOARDING_EMPTY_PROFILE_PATH, requireSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Claim submitted",
};

export default async function SubmittedPage() {
  const session = await requireSession("/onboarding/player/submitted");
  const client = await createServerApiClient();
  const claimResult = await createPlayerIdentityApi(client).getMyClaim();

  if (claimResult.status === "Verified") {
    redirect("/dashboard");
  }

  if (claimResult.status !== "PendingVerification") {
    redirect(ONBOARDING_EMPTY_PROFILE_PATH);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 px-4 py-12">
      <div className="relative mb-8">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-500 shadow-2xl">
          <Check className="h-12 w-12 text-white" strokeWidth={3} />
        </div>
        <div className="absolute inset-0 animate-ping rounded-full bg-green-400 opacity-20" />
      </div>

      <h1 className="mb-3 text-center text-4xl font-bold text-white">
        Football Profile Submitted
      </h1>
      <p className="mb-12 text-center text-lg text-gray-400">
        Our team will review your claim, {session.user.email}.
      </p>

      <VerificationTimeline />
      <SubmittedInfoCard />

      <div className="flex w-full max-w-sm flex-col gap-3 sm:flex-row">
        <Button
          size="lg"
          className="flex-1 bg-white text-gray-900 hover:bg-gray-100"
          render={<Link href="/dashboard" />}
        >
          View My Profile
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="flex-1 border-white/20 text-white hover:bg-white/10"
          render={<Link href="/dashboard" />}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
