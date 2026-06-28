"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { OnboardingHeader } from "@/components/onboarding/onboarding-header";
import { PlayerIdentityForm } from "@/components/onboarding/player-identity-form";
import {
  loadSearchCriteria,
  saveSearchCriteria,
} from "@/features/onboarding/player/storage";
import type { PlayerIdentitySearchFormValues } from "@/lib/validation/player-identity";

function normalizeSavedCriteria(
  saved: PlayerIdentitySearchFormValues | null,
): Partial<PlayerIdentitySearchFormValues> | undefined {
  if (!saved) {
    return undefined;
  }

  return {
    ...saved,
    currentCountry: saved.currentCountry ?? "",
    currentTeamId: saved.currentTeamId ?? 0,
    currentTeamName: saved.currentTeamName ?? "",
  };
}

export function ConnectPageClient() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const defaultValues = useMemo(
    () => normalizeSavedCriteria(loadSearchCriteria()),
    [],
  );

  async function handleSubmit(values: PlayerIdentitySearchFormValues) {
    setIsSubmitting(true);
    try {
      saveSearchCriteria(values);
      router.push("/onboarding/player/searching");
    } catch {
      toast.error("Could not save your details. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <OnboardingHeader
        step={1}
        totalSteps={4}
        backHref="/dashboard"
      />

      <main className="mx-auto max-w-xl px-4 py-12">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100">
            <Search className="h-7 w-7 text-blue-600" aria-hidden />
          </div>
          <h1 className="mb-3 text-3xl font-bold text-gray-900">
            Help us find your football profile
          </h1>
          <p className="text-gray-500">
            We&apos;ll use this information to search football databases.
          </p>
        </div>

        <PlayerIdentityForm
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />

        <p className="mt-5 px-4 text-center text-xs text-gray-400">
          We only use this information to find your football profile. Your data
          is never shared with third parties.
        </p>
      </main>
    </div>
  );
}

export function MatchResultsEmptyLink() {
  return (
    <div className="mt-8 text-center">
      <Link
        href="/onboarding/player/connect"
        className="text-sm text-gray-500 underline underline-offset-4 transition hover:text-blue-600"
      >
        I Can&apos;t Find My Profile
      </Link>
    </div>
  );
}
