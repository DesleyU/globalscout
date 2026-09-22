"use client";

import type { NotificationItem } from "@globalscout/shared";
import { Popover } from "@base-ui/react/popover";
import { Bell } from "lucide-react";
import Link from "next/link";
import { useNotificationsHub } from "@/hooks/use-notifications-hub";
import { cn } from "@/lib/utils";
import type { SidebarVariant } from "@/components/layout/app-sidebar";

type NotificationBellProps = {
  variant: SidebarVariant;
};

function formatRelativeTime(iso: string): string {
  const diffMs = Date.parse(iso) - Date.now();
  const diffMinutes = Math.round(diffMs / 60000);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (Math.abs(diffMinutes) < 60) {
    return formatter.format(diffMinutes, "minute");
  }
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, "hour");
  }
  const diffDays = Math.round(diffHours / 24);
  return formatter.format(diffDays, "day");
}

function notificationText(notification: NotificationItem): string {
  const name = notification.actor.profile
    ? `${notification.actor.profile.firstName} ${notification.actor.profile.lastName}`
    : "Someone";

  switch (notification.type) {
    case "ConnectionRequestReceived":
      return `${name} sent you a connection request`;
    case "ConnectionAccepted":
      return `${name} accepted your connection request`;
    case "NewFollower":
      return `${name} started following you`;
    default:
      return `${name} did something`;
  }
}

function notificationHref(notification: NotificationItem, variant: SidebarVariant): string {
  switch (notification.type) {
    case "ConnectionRequestReceived":
    case "ConnectionAccepted":
      return variant === "agent" ? "/agent/connections" : "/connections";
    case "NewFollower":
      return `/users/${notification.actor.id}`;
    default:
      return "#";
  }
}

export function NotificationBell({ variant }: NotificationBellProps) {
  const { notifications, unreadCount, isLoading, markRead, markAllRead } = useNotificationsHub();

  return (
    <Popover.Root>
      <Popover.Trigger
        className="relative rounded-full p-2 transition hover:bg-gray-100"
        aria-label="Notifications"
      >
        <Bell className="size-5 text-gray-600" />
        {unreadCount > 0 ? (
          <span className="absolute top-1 right-1 flex size-3.5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="end" sideOffset={8} className="isolate z-50">
          <Popover.Popup className="w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-gray-200 bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <span className="text-sm font-semibold text-gray-900">Notifications</span>
              {unreadCount > 0 ? (
                <button
                  type="button"
                  className="text-xs font-medium text-blue-600 hover:underline"
                  onClick={() => void markAllRead()}
                >
                  Mark all as read
                </button>
              ) : null}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <p className="px-4 py-6 text-center text-sm text-gray-500">Loading...</p>
              ) : notifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-gray-500">
                  No notifications yet
                </p>
              ) : (
                notifications.map((notification) => (
                  <Link
                    key={notification.id}
                    href={notificationHref(notification, variant)}
                    onClick={() => {
                      if (!notification.isRead) {
                        void markRead(notification.id);
                      }
                    }}
                    className={cn(
                      "flex flex-col gap-0.5 border-b border-gray-50 px-4 py-3 text-sm transition hover:bg-gray-50",
                      !notification.isRead && "bg-blue-50/60",
                    )}
                  >
                    <span className="text-gray-800">{notificationText(notification)}</span>
                    <span className="text-xs text-gray-400">
                      {formatRelativeTime(notification.createdAt)}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
