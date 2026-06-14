import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { OnboardingSessionActions } from "@/components/onboarding/onboarding-session-actions";
import { AccountTypeSelection } from "@/features/onboarding/account-type-selection";
import { createPlayerIdentityApi } from "@/lib/api/player-identity";
import { createServerApiClient } from "@/lib/api/server";
import { requireSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Choose account type",
};

export default async function AccountTypePage() {
  const session = await requireSession("/onboarding/account-type");

  if (session.user.role !== "PLAYER" && session.user.role !== "PENDING") {
    redirect("/dashboard");
  }

  if (session.user.role === "PLAYER") {
    const client = await createServerApiClient();
    const claimResult = await createPlayerIdentityApi(client).getMyClaim();

    if (claimResult.status === "PendingVerification") {
      redirect("/onboarding/player/submitted");
    }

    if (claimResult.status === "Verified") {
      redirect("/dashboard");
    }

    if (claimResult.status === "Claimed") {
      redirect("/onboarding/player/claim");
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950">
      <header className="flex items-center justify-between px-8 py-6">
        <Image
          src="/logo/globalscout-logo.svg"
          alt="GlobalScout"
          width={140}
          height={40}
          className="h-10 w-auto brightness-0 invert"
        />
        <OnboardingSessionActions variant="dark" />
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="mb-12 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-600/20 px-4 py-1.5 text-sm text-blue-300">
            <Sparkles className="h-4 w-4" aria-hidden />
            Welcome to GlobalScout
          </div>
          <h1 className="mb-4 text-4xl font-bold text-white md:text-5xl">
            Welcome to Global Scout
          </h1>
          <p className="text-xl text-gray-400">
            Tell us how you&apos;ll use the platform.
          </p>
        </div>

        <AccountTypeSelection />

        <p className="mt-8 text-sm text-gray-500">
          You can change this later in your account settings.
        </p>
      </main>
    </div>
  );
}
