import { redirect } from "next/navigation";
import type { Session } from "./get-session";
import { isAdminUser } from "./is-admin";
import { requireSession } from "./require-session";

export async function requireMember(): Promise<Session> {
  const session = await requireSession();

  if (isAdminUser(session.user)) {
    redirect("/admin");
  }

  return session;
}
