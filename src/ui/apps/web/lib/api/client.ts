import { createApiTransport, type ApiTransport } from "@globalscout/shared";
import { getPublicApiBaseUrl } from "@/lib/env";
import { createServerSideFetch } from "./server-fetch";

function resolveFetch(options: WebApiClientOptions): typeof fetch | undefined {
  if (options.fetch) {
    return options.fetch;
  }

  if (typeof window === "undefined") {
    return createServerSideFetch();
  }

  return undefined;
}

export type WebApiClientOptions = {
  baseUrl?: string;
  getAuthToken?: () =>
    | string
    | null
    | undefined
    | Promise<string | null | undefined>;
  getHeaders?: () => HeadersInit | Promise<HeadersInit>;
  credentials?: RequestCredentials;
  fetch?: typeof fetch;
};

/** Create a cookie/session-aware API transport for the Next.js web app. */
export function createWebApiClient(
  options: WebApiClientOptions = {},
): ApiTransport {
  return createApiTransport({
    baseUrl: options.baseUrl ?? getPublicApiBaseUrl(),
    getAuthToken: options.getAuthToken,
    getHeaders: options.getHeaders,
    credentials: options.credentials ?? "include",
    fetch: resolveFetch(options),
  });
}

export type { ApiTransport };
