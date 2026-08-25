"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { OnboardingHeader } from "@/components/onboarding/onboarding-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { loadManualCountry } from "@/features/onboarding/player/storage";
import { ManualSeasonForm } from "@/features/statistics/manual-season-form";

type StatsOnboardingPageClientProps = {
  isPremium?: boolean;
};

export function StatsOnboardingPageClient({
  isPremium = false,
}: StatsOnboardingPageClientProps) {
  const router = useRouter();
  const defaultCountry = useMemo(() => loadManualCountry() ?? "", []);

  return (
    <div className="min-h-screen bg-gray-50">
      <OnboardingHeader
        step={3}
        totalSteps={4}
        backHref="/onboarding/player/manual"
      />

      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-8 text-center">
          <h1 className="mb-3 text-3xl font-bold text-gray-900">
            Add your first season
          </h1>
          <p className="text-gray-500">
            Enter your stats per club and competition. You can skip this and add
            seasons later from the Statistics page.
          </p>
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-8">
            <ManualSeasonForm
              lockedSeasons={[]}
              initialCountry={defaultCountry}
              isPremium={isPremium}
              submitLabel="Save and continue"
              onSuccess={() => {
                router.push("/dashboard");
                router.refresh();
              }}
            />

            <div className="mt-6 text-center">
              <Button
                variant="ghost"
                render={<Link href="/dashboard" />}
                className="text-sm text-gray-500"
              >
                Skip for now
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
