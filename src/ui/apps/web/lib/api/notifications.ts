import {
  notificationsPaths,
  type ApiTransport,
  type GetNotificationsParams,
  type GetNotificationsResult,
  type MarkAllNotificationsReadResponse,
  type MarkNotificationReadResponse,
} from "@globalscout/shared";

function toQueryString(params: GetNotificationsParams): string {
  const search = new URLSearchParams();
  if (params.page !== undefined) search.set("page", String(params.page));
  if (params.limit !== undefined) search.set("limit", String(params.limit));
  const query = search.toString();
  return query ? `?${query}` : "";
}

export function createNotificationsApi(client: ApiTransport) {
  return {
    getNotifications(params: GetNotificationsParams = {}) {
      return client.get<GetNotificationsResult>(
        `${notificationsPaths.list}${toQueryString(params)}`,
      );
    },

    markRead(notificationId: string) {
      return client.put<MarkNotificationReadResponse>(
        notificationsPaths.read(notificationId),
      );
    },

    markAllRead() {
      return client.put<MarkAllNotificationsReadResponse>(
        notificationsPaths.readAll,
      );
    },
  };
}

export type NotificationsApi = ReturnType<typeof createNotificationsApi>;
