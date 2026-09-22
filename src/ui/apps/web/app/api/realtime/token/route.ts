import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth/constants";

/** Relays the session's HttpOnly JWT to same-origin browser code for a SignalR hub handshake. */
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ token });
}
