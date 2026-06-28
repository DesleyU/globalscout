import type { GetMyPlayerIdentityClaimResult } from "@globalscout/shared";
import { DEFAULT_AUTHENTICATED_REDIRECT } from "./constants";

export const ONBOARDING_ACCOUNT_TYPE_PATH = "/onboarding/account-type";
export const ONBOARDING_SUBMITTED_PATH = "/onboarding/player/submitted";
export const ONBOARDING_CLAIM_PATH = "/onboarding/player/claim";
/** Incomplete player home; legacy name kept for existing imports. */
export const ONBOARDING_EMPTY_PROFILE_PATH = DEFAULT_AUTHENTICATED_REDIRECT;

/** Client-safe redirect resolver based on claim status. */
export function resolvePlayerOnboardingRedirect(
  claimResult: GetMyPlayerIdentityClaimResult | null,
): string {
  if (!claimResult) {
    return ONBOARDING_ACCOUNT_TYPE_PATH;
  }

  switch (claimResult.status) {
    case "PendingVerification":
      return ONBOARDING_SUBMITTED_PATH;
    case "Verified":
      return DEFAULT_AUTHENTICATED_REDIRECT;
    case "Claimed":
      return ONBOARDING_CLAIM_PATH;
    case "Rejected":
      return ONBOARDING_EMPTY_PROFILE_PATH;
    case "Unmatched":
    default:
      return ONBOARDING_EMPTY_PROFILE_PATH;
  }
}
