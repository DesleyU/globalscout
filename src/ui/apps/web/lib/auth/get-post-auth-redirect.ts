import { createWebApiClient } from "@/lib/api/client";
import { createPlayerIdentityApi } from "@/lib/api/player-identity";
import { createServerApiClient } from "@/lib/api/server";
import {
  ONBOARDING_ACCOUNT_TYPE_PATH,
  resolvePlayerOnboardingRedirect,
} from "./onboarding-redirect";
import {
  DEFAULT_ADMIN_REDIRECT,
  DEFAULT_AGENT_REDIRECT,
  ROLES,
} from "./roles";

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
  if (role === ROLES.PENDING) {
    return ONBOARDING_ACCOUNT_TYPE_PATH;
  }

  if (role === ROLES.ADMIN) {
    return DEFAULT_ADMIN_REDIRECT;
  }

  if (role === ROLES.SCOUT_AGENT) {
    return DEFAULT_AGENT_REDIRECT;
  }

  if (role !== ROLES.PLAYER) {
    return ONBOARDING_ACCOUNT_TYPE_PATH;
  }

  try {
    const claimResult = await fetchClaimStatus(token);
    return resolvePlayerOnboardingRedirect(claimResult);
  } catch {
    return ONBOARDING_ACCOUNT_TYPE_PATH;
  }
}
