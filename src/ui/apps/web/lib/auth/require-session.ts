import { redirect } from "next/navigation";
import { getSession, type Session } from "./get-session";

export async function requireSession(returnTo?: string): Promise<Session> {
  const session = await getSession();

  if (!session) {
    const params = returnTo
      ? `?returnTo=${encodeURIComponent(returnTo)}`
      : "";
    redirect(`/sign-in${params}`);
  }

  return session;
}
