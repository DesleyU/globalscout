import { cookies } from "next/headers";
import { createWebApiClient, type ApiTransport } from "./client";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth/constants";
/** Server-side API client that reads the auth token from request cookies. */
export async function createServerApiClient(): Promise<ApiTransport> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

  return createWebApiClient({
    getAuthToken: () => token ?? null,
  });
}

export { AUTH_TOKEN_COOKIE } from "@/lib/auth/constants";