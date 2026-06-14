"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SearchingAnimation } from "@/components/onboarding/searching-animation";
import { createBrowserPlayerIdentityApi } from "@/lib/api/player-identity-browser";
import {
  loadSearchCriteria,
  saveMatches,
} from "@/features/onboarding/player/storage";

export function SearchingPageClient() {
  const router = useRouter();
  const hasStarted = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [searchFinished, setSearchFinished] = useState(false);

  useEffect(() => {
    if (hasStarted.current) {
      return;
    }
    hasStarted.current = true;

    const criteria = loadSearchCriteria();
    if (!criteria) {
      router.replace("/onboarding/player/connect");
      return;
    }

    const api = createBrowserPlayerIdentityApi();

    void api
      .searchPlayers(criteria)
      .then((result) => {
        saveMatches(result.matches ?? []);
        setSearchFinished(true);
      })
      .catch((searchError: unknown) => {
        const message =
          searchError instanceof Error
            ? searchError.message
            : "Search failed";
        setError(message);
        toast.error(message);
      });
  }, [router]);

  const handleComplete = useCallback(() => {
    if (error) {
      router.replace("/onboarding/player/connect");
      return;
    }
    router.push("/onboarding/player/match-results");
  }, [error, router]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 px-4 text-center text-white">
        <p className="mb-4 text-lg">{error}</p>
        <button
          type="button"
          className="text-blue-300 underline underline-offset-4"
          onClick={() => router.replace("/onboarding/player/connect")}
        >
          Go back and try again
        </button>
      </div>
    );
  }

  return (
    <SearchingAnimation
      canFinish={searchFinished}
      onComplete={handleComplete}
    />
  );
}
