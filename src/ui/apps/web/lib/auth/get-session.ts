import type { AuthUserDto } from "@globalscout/shared";
import { cookies } from "next/headers";
import { createAuthApi } from "@/lib/api/auth";
import { createWebApiClient } from "@/lib/api/client";
import { getPublicApiBaseUrl } from "@/lib/env";
import { AUTH_TOKEN_COOKIE } from "./constants";

export type Session = {
  user: AuthUserDto;
};

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const client = createWebApiClient({
      baseUrl: getPublicApiBaseUrl(),
      getAuthToken: () => token,
    });
    const profile = await createAuthApi(client).getProfile();
    return { user: profile.user };
  } catch {
    return null;
  }
}
