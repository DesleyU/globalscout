# Contracts: Notification REST endpoints + SignalR hub

## REST endpoints (`GlobalScout.Api/Endpoints/Social/Notifications/`, base `api/notifications`)

All routes require authentication (`.RequireAuthorization()`), matching every existing Social endpoint. `userId` is always resolved from the authenticated principal (`HttpUser.ResolveId(user)`) — never taken from the URL, since a notification list is always "my own."

### `GET api/notifications?page=&limit=`

Returns the authenticated user's notification history, most recent first.

Response `200`:
```json
{
  "notifications": [
    {
      "id": "guid",
      "type": "NewFollower",
      "actor": { "id": "guid", "role": "Player", "profile": { "...": "UserProfileApiDto shape" } },
      "relatedEntityId": "guid|null",  // Connection.Id for ConnectionRequestReceived/ConnectionAccepted, Follow.Id for NewFollower — see data-model.md's Type -> RelatedEntityId table
      "isRead": false,
      "createdAt": "2026-09-15T12:00:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 3, "pages": 1 },
  "unreadCount": 2
}
```

### `PUT api/notifications/{notificationId:guid}/read`

Marks one notification read. `404` (`Social.NotificationNotFound`) if it doesn't exist or doesn't belong to the caller.

Response `200`:
```json
{ "id": "guid", "isRead": true, "unreadCount": 1 }
```

### `PUT api/notifications/read-all`

Marks every unread notification for the caller as read.

Response `200`:
```json
{ "markedCount": 2, "unreadCount": 0 }
```

## SignalR hub (`/hubs/notifications`, `NotificationHub`)

Same auth as the existing `/hubs/messages`: JWT via `?access_token=` query string (or `accessTokenFactory` client-side), handled by the existing `JwtBearerEvents.OnMessageReceived` path-prefix check — no new server auth wiring.

Server → client events (pushed via `Clients.User(recipientUserId)`):

| Event | Payload | Sent when |
|---|---|---|
| `ReceiveNotification` | `NotificationDto` (same shape as the REST list item) | A new notification is created (or an unread one is bumped by the dedup rule) for a recipient with an active hub connection |
| `NotificationsUpdated` | `{ "unreadCount": number }` | After any read-state change (`PUT .../read`, `PUT .../read-all`) for that recipient — keeps every open tab/device's badge in sync (FR-008) |

No client → server hub methods are defined (mirrors `MessageHub`, which is also a pure server-push marker hub).

**`ReceiveNotification` never changes read state.** It fires for a row that was already persisted as `IsRead = false` (persistence happens identically whether or not the recipient has an active connection — the hub push is purely a delivery mechanism, not a state change). Receiving it client-side only means: prepend the `NotificationDto` to the panel's list and increment the unread counter. The row only flips to `IsRead = true` via an explicit `PUT .../read` or `PUT .../read-all` call, same as if the notification had arrived while offline and the user later found it in history — being pushed live and being read are independent. This is also why `NotificationsUpdated` exists as a distinct event: `ReceiveNotification` announces new unread content, `NotificationsUpdated` announces a read-state change (from *any* session, including one that isn't this one) — a client needs both, and neither implies the other.

## Frontend consumption contract

- REST calls (`lib/api/notifications.ts`, mirroring `lib/api/follow.ts`/`messages.ts`) go through the existing same-origin `/api/*` BFF pattern, `credentials: "include"`.
- The SignalR client authenticates via a new same-origin BFF route, `GET /api/realtime/token` → `{ "token": string }`, called by `accessTokenFactory` (see research.md §3). This route is shared infrastructure — any future hub client (e.g. eventually wiring up chat) can reuse it; it is not notification-specific.
- Header bell badge count and notification panel state are driven by: initial REST fetch (`GET api/notifications`) for history + `unreadCount` on mount, then live-updated by `ReceiveNotification` (prepend to list, increment count) and `NotificationsUpdated` (replace count) over the hub connection while it's open.
