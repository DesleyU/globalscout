import type {
  GetNotificationsParams,
  GetNotificationsResult,
  MarkAllNotificationsReadResponse,
  MarkNotificationReadResponse,
} from "@globalscout/shared";

async function parseJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { error?: string; message?: string };
  if (!response.ok) {
    throw new Error(data.error ?? data.message ?? "Request failed");
  }
  return data;
}

async function requestJson<T>(path: string, method: string): Promise<T> {
  const response = await fetch(path, {
    method,
    credentials: "include",
  });
  return parseJson<T>(response);
}

function toQueryString(params: GetNotificationsParams): string {
  const search = new URLSearchParams();
  if (params.page !== undefined) search.set("page", String(params.page));
  if (params.limit !== undefined) search.set("limit", String(params.limit));
  const query = search.toString();
  return query ? `?${query}` : "";
}

/** Browser-safe notifications API via Next route handlers. */
export function createBrowserNotificationsApi() {
  return {
    getNotifications(params: GetNotificationsParams = {}) {
      return requestJson<GetNotificationsResult>(
        `/api/notifications${toQueryString(params)}`,
        "GET",
      );
    },

    markRead(notificationId: string) {
      return requestJson<MarkNotificationReadResponse>(
        `/api/notifications/${notificationId}/read`,
        "PUT",
      );
    },

    markAllRead() {
      return requestJson<MarkAllNotificationsReadResponse>(
        "/api/notifications/read-all",
        "PUT",
      );
    },
  };
}

export type BrowserNotificationsApi = ReturnType<typeof createBrowserNotificationsApi>;
