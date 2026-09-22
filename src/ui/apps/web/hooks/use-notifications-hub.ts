"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import type { NotificationItem } from "@globalscout/shared";
import { createBrowserNotificationsApi } from "@/lib/api/notifications-browser";
import { getPublicApiOrigin } from "@/lib/env";

type NotificationsState = {
  items: NotificationItem[];
  unreadCount: number;
};

async function fetchRealtimeToken(): Promise<string> {
  const response = await fetch("/api/realtime/token", { credentials: "include" });
  if (!response.ok) {
    return "";
  }
  const { token } = (await response.json()) as { token: string };
  return token;
}

export function useNotificationsHub() {
  const [state, setState] = useState<NotificationsState>({ items: [], unreadCount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const apiRef = useRef(createBrowserNotificationsApi());

  useEffect(() => {
    let cancelled = false;

    apiRef.current
      .getNotifications({ limit: 20 })
      .then((result) => {
        if (cancelled) return;
        setState({ items: result.notifications, unreadCount: result.unreadCount });
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${getPublicApiOrigin()}/hubs/notifications`, {
        accessTokenFactory: fetchRealtimeToken,
      })
      .withAutomaticReconnect()
      .build();

    connection.on("ReceiveNotification", (notification: NotificationItem) => {
      setState((prev) => {
        const existing = prev.items.find((n) => n.id === notification.id);
        const isNewUnread = !existing || existing.isRead;
        const items = [notification, ...prev.items.filter((n) => n.id !== notification.id)];
        return {
          items,
          unreadCount: isNewUnread ? prev.unreadCount + 1 : prev.unreadCount,
        };
      });
    });

    connection.on("NotificationsUpdated", (payload: { unreadCount: number }) => {
      setState((prev) => ({ ...prev, unreadCount: payload.unreadCount }));
    });

    connection.start().catch(() => {});

    return () => {
      cancelled = true;
      void connection.stop();
    };
  }, []);

  const markRead = useCallback(async (notificationId: string) => {
    const result = await apiRef.current.markRead(notificationId);
    setState((prev) => ({
      items: prev.items.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)),
      unreadCount: result.unreadCount,
    }));
  }, []);

  const markAllRead = useCallback(async () => {
    const result = await apiRef.current.markAllRead();
    setState((prev) => ({
      items: prev.items.map((n) => ({ ...n, isRead: true })),
      unreadCount: result.unreadCount,
    }));
  }, []);

  return {
    notifications: state.items,
    unreadCount: state.unreadCount,
    isLoading,
    markRead,
    markAllRead,
  };
}
