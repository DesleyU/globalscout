import { redirect } from "next/navigation";
import { DEFAULT_AUTHENTICATED_REDIRECT } from "./constants";
import { isAdminUser } from "./is-admin";
import type { Session } from "./get-session";
import { requireSession } from "./require-session";

export async function requireAdmin(): Promise<Session> {
  const session = await requireSession();

  if (!isAdminUser(session.user)) {
    redirect(DEFAULT_AUTHENTICATED_REDIRECT);
  }

  return session;
}
