import type {
  PlayerStatisticsResponse,
  UpsertMyStatsRequest,
  UpsertMyStatsResponse,
} from "@globalscout/shared";

async function parseJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { error?: string; message?: string };
  if (!response.ok) {
    throw new Error(data.error ?? data.message ?? "Request failed");
  }
  return data;
}

async function requestJson<T>(
  path: string,
  method: string,
  body?: unknown,
): Promise<T> {
  const response = await fetch(path, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    credentials: "include",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return parseJson<T>(response);
}

/** Browser-safe stats API via Next route handlers. */
export function createBrowserStatsApi() {
  return {
    getMyStats() {
      return requestJson<PlayerStatisticsResponse>("/api/stats/me", "GET");
    },

    updateMyStats(body: UpsertMyStatsRequest) {
      return requestJson<UpsertMyStatsResponse>("/api/stats/me", "PUT", body);
    },

    deleteMySeason(season: string) {
      return requestJson<{ message: string }>(
        `/api/stats/me/${encodeURIComponent(season)}`,
        "DELETE",
      );
    },
  };
}
