import { redirect } from "next/navigation";
import type { Session } from "./get-session";
import { ONBOARDING_ACCOUNT_TYPE_PATH } from "./onboarding-redirect";
import { isPendingUser } from "./roles";
import { requireSession } from "./require-session";

/**
 * App-boundary guard: ensures a PENDING user finishes role selection before
 * reaching any authenticated section of the app.
 */
export async function requirePendingOnboarding(): Promise<Session> {
  const session = await requireSession();

  if (isPendingUser(session.user)) {
    redirect(ONBOARDING_ACCOUNT_TYPE_PATH);
  }

  return session;
}
