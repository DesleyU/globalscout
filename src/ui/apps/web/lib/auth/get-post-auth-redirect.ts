import { createWebApiClient } from "@/lib/api/client";
import { createPlayerIdentityApi } from "@/lib/api/player-identity";
import { createServerApiClient } from "@/lib/api/server";
import { DEFAULT_AUTHENTICATED_REDIRECT } from "./constants";
import {
  ONBOARDING_ACCOUNT_TYPE_PATH,
  resolvePlayerOnboardingRedirect,
} from "./onboarding-redirect";

async function fetchClaimStatus(token?: string | null) {
  const client = token
    ? createWebApiClient({ getAuthToken: () => token })
    : await createServerApiClient();

  return createPlayerIdentityApi(client).getMyClaim();
}

/** Server-only: resolve post-login/register destination for a role. */
export async function getPostAuthRedirect(
  role: string,
  token?: string | null,
): Promise<string> {
  if (role === "PENDING") {
    return ONBOARDING_ACCOUNT_TYPE_PATH;
  }

  if (role === "ADMIN") {
    return "/admin";
  }

  if (role !== "PLAYER") {
    return DEFAULT_AUTHENTICATED_REDIRECT;
  }

  try {
    const claimResult = await fetchClaimStatus(token);
    return resolvePlayerOnboardingRedirect(claimResult);
  } catch {
    return ONBOARDING_ACCOUNT_TYPE_PATH;
  }
}
