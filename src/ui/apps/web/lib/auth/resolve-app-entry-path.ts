import {
  DEFAULT_ADMIN_REDIRECT,
  DEFAULT_AGENT_REDIRECT,
  DEFAULT_PLAYER_REDIRECT,
  ROLES,
} from "./roles";
import { ONBOARDING_ACCOUNT_TYPE_PATH } from "./onboarding-redirect";

/**
 * Client-safe resolver for where a role should land in the app.
 *
 * For PLAYER this returns the player home (`/dashboard`); the full
 * claim-aware destination is resolved server-side by `getPostAuthRedirect`.
 */
export function resolveAppEntryPath(role: string | null | undefined): string {
  switch (role) {
    case ROLES.PENDING:
      return ONBOARDING_ACCOUNT_TYPE_PATH;
    case ROLES.ADMIN:
      return DEFAULT_ADMIN_REDIRECT;
    case ROLES.SCOUT_AGENT:
      return DEFAULT_AGENT_REDIRECT;
    case ROLES.PLAYER:
      return DEFAULT_PLAYER_REDIRECT;
    default:
      return ONBOARDING_ACCOUNT_TYPE_PATH;
  }
}
