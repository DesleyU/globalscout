import type { UserProfileDto } from "./users";
import type { PaginationDto } from "./common";

export type NotificationType =
  | "ConnectionRequestReceived"
  | "ConnectionAccepted"
  | "NewFollower";

export interface NotificationActor {
  id: string;
  role: string;
  profile: UserProfileDto | null;
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  actor: NotificationActor;
  relatedEntityId: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface GetNotificationsResult {
  notifications: NotificationItem[];
  pagination: PaginationDto;
  unreadCount: number;
}

export interface GetNotificationsParams {
  page?: number;
  limit?: number;
}

export interface MarkNotificationReadResponse {
  id: string;
  isRead: boolean;
  unreadCount: number;
}

export interface MarkAllNotificationsReadResponse {
  markedCount: number;
  unreadCount: number;
}
