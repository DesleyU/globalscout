/** Production default; override via NEXT_PUBLIC_API_BASE_URL in each app. */
export const DEFAULT_API_BASE_URL = "https://api.globalscout.eu/api";

/**
 * Resolves the API base URL from an optional environment override.
 * Browser and mobile clients must use an absolute API URL, not a relative /api path.
 */
export function resolveApiBaseUrl(envValue?: string | null): string {
  const trimmed = envValue?.trim();
  if (trimmed) {
    return trimmed.replace(/\/+$/, "");
  }

  return DEFAULT_API_BASE_URL;
}

/**
 * Joins an API base URL with a path segment, normalizing slashes.
 */
export function buildApiUrl(baseUrl: string, path: string): string {
  const normalizedBase = baseUrl.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}
