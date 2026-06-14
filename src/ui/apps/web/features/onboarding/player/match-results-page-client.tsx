"use client";

import type { PlayerMatchDto } from "@globalscout/shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Search, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { MatchResultCard } from "@/components/onboarding/match-result-card";
import { OnboardingHeader } from "@/components/onboarding/onboarding-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  loadMatches,
  loadSearchCriteria,
  saveSelectedMatch,
} from "@/features/onboarding/player/storage";
import { createBrowserPlayerIdentityApi } from "@/lib/api/player-identity-browser";

export function MatchResultsPageClient() {
  const router = useRouter();
  const initialMatches = useMemo(() => loadMatches(), []);
  const [matches, setMatches] = useState(initialMatches ?? []);
  const [isCreatingClaim, setIsCreatingClaim] = useState(false);

  useEffect(() => {
    if (initialMatches === null) {
      router.replace("/onboarding/player/connect");
    }
  }, [initialMatches, router]);

  if (initialMatches === null) {
    return null;
  }

  function handleDismiss(match: PlayerMatchDto) {
    setMatches((current) =>
      current.filter(
        (item) =>
          !(
            item.externalPlayerId === match.externalPlayerId &&
            item.provider === match.provider
          ),
      ),
    );
  }

  async function handleSelect(match: PlayerMatchDto) {
    const criteria = loadSearchCriteria();
    if (!criteria) {
      router.replace("/onboarding/player/connect");
      return;
    }

    setIsCreatingClaim(true);
    try {
      const api = createBrowserPlayerIdentityApi();
      await api.createClaim({
        firstName: criteria.firstName,
        lastName: criteria.lastName,
        dateOfBirth: criteria.dateOfBirth,
        nationality: criteria.nationality,
        currentCountry: criteria.currentCountry,
        currentTeamId: criteria.currentTeamId,
        currentClub: criteria.currentTeamName,
        position: criteria.position,
        league: criteria.league ?? null,
        externalPlayerId: match.externalPlayerId,
        provider: match.provider,
      });
      saveSelectedMatch(match);
      router.push("/onboarding/player/claim");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not create claim";
      toast.error(message);
    } finally {
      setIsCreatingClaim(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <OnboardingHeader
        step={3}
        totalSteps={4}
        backHref="/onboarding/player/connect"
      />

      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100">
            <UserCheck className="h-7 w-7 text-green-600" aria-hidden />
          </div>
          <h1 className="mb-3 text-3xl font-bold text-gray-900">
            Is one of these you?
          </h1>
          <p className="text-gray-500">
            We found football profiles that closely match your information.
          </p>
        </div>

        {matches.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="mb-2 font-bold text-gray-900">
                No matching profiles found
              </h3>
              <p className="mb-6 text-gray-500">
                We couldn&apos;t find a football profile that matches your
                details. Try adjusting your search.
              </p>
              <Button render={<Link href="/onboarding/player/connect" />}>
                Search Again
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-5">
            {matches.map((match) => (
              <MatchResultCard
                key={`${match.provider}-${match.externalPlayerId}`}
                match={match}
                onSelect={handleSelect}
                onDismiss={handleDismiss}
              />
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/onboarding/player/connect"
            className="text-sm text-gray-500 underline underline-offset-4 transition hover:text-blue-600"
          >
            I Can&apos;t Find My Profile
          </Link>
        </div>

        {isCreatingClaim ? (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Creating your claim...
          </p>
        ) : null}
      </main>
    </div>
  );
}
