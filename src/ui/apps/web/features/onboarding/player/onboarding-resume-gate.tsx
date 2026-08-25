"use client";

import type { GetMyPlayerIdentityClaimResult } from "@globalscout/shared";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  ONBOARDING_CLAIM_PATH,
  ONBOARDING_EMPTY_PROFILE_PATH,
  ONBOARDING_SUBMITTED_PATH,
  resolvePlayerOnboardingRedirect,
} from "@/lib/auth/onboarding-redirect";

const ALLOWED_PATHS_BY_STATUS: Record<string, string[]> = {
  Unmatched: [
    ONBOARDING_EMPTY_PROFILE_PATH,
    "/onboarding/player/connect",
    "/onboarding/player/searching",
    "/onboarding/player/match-results",
    "/onboarding/player/manual",
    "/onboarding/player/stats",
    ONBOARDING_CLAIM_PATH,
  ],
  Rejected: [
    ONBOARDING_EMPTY_PROFILE_PATH,
    "/onboarding/player/connect",
    "/onboarding/player/searching",
    "/onboarding/player/match-results",
    "/onboarding/player/manual",
    "/onboarding/player/stats",
    ONBOARDING_CLAIM_PATH,
  ],
  Claimed: [
    "/onboarding/player/connect",
    "/onboarding/player/searching",
    "/onboarding/player/match-results",
    ONBOARDING_CLAIM_PATH,
  ],
  PendingVerification: [ONBOARDING_SUBMITTED_PATH],
  SelfReported: [],
  Verified: [],
};

type OnboardingResumeGateProps = {
  claimResult: GetMyPlayerIdentityClaimResult;
  children: React.ReactNode;
};

export function OnboardingResumeGate({
  claimResult,
  children,
}: OnboardingResumeGateProps) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const target = resolvePlayerOnboardingRedirect(claimResult);
    const allowedPaths =
      ALLOWED_PATHS_BY_STATUS[claimResult.status] ??
      ALLOWED_PATHS_BY_STATUS.Unmatched!;

    if (claimResult.status === "Verified" || claimResult.status === "SelfReported") {
      router.replace("/dashboard");
      return;
    }

    if (!allowedPaths.includes(pathname)) {
      router.replace(target);
    }
  }, [claimResult, pathname, router]);

  return children;
}
