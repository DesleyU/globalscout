import { redirect } from "next/navigation";
import type { Session } from "./get-session";
import { resolveAppEntryPath } from "./resolve-app-entry-path";
import { isAgentUser } from "./roles";
import { requireSession } from "./require-session";

/** Section guard: only SCOUT_AGENT users may access agent routes. */
export async function requireAgent(): Promise<Session> {
  const session = await requireSession();

  if (!isAgentUser(session.user)) {
    redirect(resolveAppEntryPath(session.user.role));
  }

  return session;
}
