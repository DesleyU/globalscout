import { DEFAULT_API_BASE_URL } from "../constants";

/** Normalize an absolute API base URL (must include `/api`). */
export function resolveApiBaseUrl(value?: string | null): string {
  const candidate = value?.trim() || DEFAULT_API_BASE_URL;
  if (!/^https?:\/\//i.test(candidate)) {
    return DEFAULT_API_BASE_URL;
  }
  return candidate.replace(/\/+$/, "");
}

/** Resolve a path against the configured API base URL. */
export function resolveApiUrl(baseUrl: string, path: string): string {
  if (!path) {
    return baseUrl;
  }
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${resolveApiBaseUrl(baseUrl)}${normalized}`;
}

/** API origin for SignalR and other non-/api browser traffic. */
export function resolveApiOrigin(baseUrl: string): string {
  return new URL(resolveApiBaseUrl(baseUrl)).origin;
}

/** Resolve a path against the API origin (no `/api` suffix). */
export function resolveApiHostUrl(baseUrl: string, path: string): string {
  if (!path) {
    return resolveApiOrigin(baseUrl);
  }
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${resolveApiOrigin(baseUrl)}${normalized}`;
}

/** Resolve a SignalR hub URL against the API origin. */
export function resolveHubUrl(baseUrl: string, path: string): string {
  const normalized = path.startsWith("/hubs/")
    ? path
    : `/hubs/${path.replace(/^\/+/, "")}`;
  return resolveApiHostUrl(baseUrl, normalized);
}
