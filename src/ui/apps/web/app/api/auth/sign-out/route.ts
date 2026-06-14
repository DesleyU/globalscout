import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth";
import { createAuthApi } from "@/lib/api/auth";
import { createWebApiClient } from "@/lib/api/client";
import { getPublicApiBaseUrl } from "@/lib/env";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

  if (token) {
    try {
      const client = createWebApiClient({
        baseUrl: getPublicApiBaseUrl(),
        getAuthToken: () => token,
      });
      await createAuthApi(client).logout();
    } catch {
      // Clear the local session even if backend logout fails.
    }
  }

  cookieStore.delete(AUTH_TOKEN_COOKIE);

  return NextResponse.json({ message: "Signed out" });
}
