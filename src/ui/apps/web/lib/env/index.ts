import { resolveApiBaseUrl } from "@globalscout/shared";

export function getPublicApiBaseUrl(): string {
  return resolveApiBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);
}

/** API origin for SignalR and other non-/api browser traffic. */
export function getPublicApiOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_API_ORIGIN?.trim();
  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  return new URL(getPublicApiBaseUrl()).origin;
}
