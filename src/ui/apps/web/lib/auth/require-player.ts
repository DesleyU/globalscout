import { redirect } from "next/navigation";
import type { Session } from "./get-session";
import { resolveAppEntryPath } from "./resolve-app-entry-path";
import { isPlayerUser } from "./roles";
import { requireSession } from "./require-session";

/** Section guard: only PLAYER users may access player routes. */
export async function requirePlayer(): Promise<Session> {
  const session = await requireSession();

  if (!isPlayerUser(session.user)) {
    redirect(resolveAppEntryPath(session.user.role));
  }

  return session;
}
