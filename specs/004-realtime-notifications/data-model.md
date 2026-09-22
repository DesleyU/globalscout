# Phase 1 Data Model: Real-Time Notifications

## Notification (new entity)

`GlobalScout.Domain.Social.Notification` — plain POCO, flat under `Social/` alongside sibling `Follow`/`Connection`/`Message` (no base `Entity` class exists in this codebase to inherit from).

| Field | Type | Notes |
|---|---|---|
| `Id` | `Guid` | PK |
| `RecipientUserId` | `Guid` | FK → `ApplicationUser`, `Restrict` (matches `Follow`/`Connection`/`Message` convention) |
| `Type` | `NotificationType` (enum) | Stored as `int` (default EF Core behavior — matches how `ConnectionStatus` and `PlayerIdentityClaim.Status` are stored elsewhere; no `HasConversion<string>()` used anywhere in this codebase) |
| `ActorUserId` | `Guid` | FK → `ApplicationUser`, `Restrict`. The "other" user whose action caused the notification (the follower, the connection sender/receiver) |
| `RelatedEntityId` | `Guid?` | **No FK constraint, no separate type-discriminator column.** Points at the `Follow.Id` or `Connection.Id` that caused this notification, for deep-linking. Nullable and unconstrained so the notification survives deletion of the underlying row (edge case: "deep link degrades gracefully"). Which entity it points at is a pure function of `Type` — see table below — not an independent field, since the mapping is fixed and total (every `NotificationType` value has exactly one related-entity kind) |
| `IsRead` | `bool` | Default `false` |
| `CreatedAt` | `DateTimeOffset` | Set at creation; bumped (not duplicated) on a redundant repeat event — see dedup rule below |
| `ReadAt` | `DateTimeOffset?` | Set when marked read; cleared is never needed (read is one-directional per FR-009/edge cases) |

**Indexes**:
- `(RecipientUserId, CreatedAt)` — supports the paginated "most recent first" list query (FR-006).
- `(RecipientUserId, IsRead)` — supports the unread-count query (FR-007) and the dedup lookup (`WHERE RecipientUserId = @r AND Type = @t AND ActorUserId = @a AND IsRead = false`).

**Table**: `notifications` (snake_case, `EFCore.NamingConventions`).

## NotificationType (new enum)

`GlobalScout.Domain.Social.NotificationType` — mirrors the plain enum style of `ConnectionStatus`/`UserRole` (no `[Flags]`, sequential values):

```csharp
public enum NotificationType
{
    ConnectionRequestReceived = 0,
    ConnectionAccepted = 1,
    NewFollower = 2
}
```

Room for future types (e.g. `NewMessage`) without a redesign, per spec's Key Entities section — just append new values.

**`Type` → `RelatedEntityId` kind mapping** (fixed, total — every type maps to exactly one entity kind):

| `Type` | `RelatedEntityId` is a... | Deep-link target (FR-009) |
|---|---|---|
| `ConnectionRequestReceived` | `Connection.Id` | Pending requests view (the connection may be looked up within it to highlight it; if it was withdrawn before viewing, the view still renders, just without that row — "degrades gracefully") |
| `ConnectionAccepted` | `Connection.Id` | Pending requests / connections view |
| `NewFollower` | `Follow.Id` | The follower's profile — note this link actually resolves via `Actor.Id` (the follower's user id), not `RelatedEntityId`; the follow id is carried for completeness/future use (e.g. an "unfollow" affordance from the notification) but isn't needed to build the profile link itself |

**Alternative considered**: an explicit `RelatedEntityType` enum/string column stored alongside `RelatedEntityId` — rejected as redundant. `Type` already determines the entity kind 1:1 with no branching left over, so a second column would only duplicate information already present and risk drifting out of sync with `Type` over time. If a future `NotificationType` ever needs to reference more than one possible entity kind (not the case for any of the three types here), that's the point to introduce a discriminator — not before.

## Validation / business rules

- A notification is only ever created as a side effect of an already-successful Follow/Connection write (FR-010) — there is no independent "create notification" command exposed publicly; it is always invoked from inside `FollowUserCommandHandler`, `SendConnectionRequestCommandHandler`, and `RespondToConnectionCommandHandler` after their existing repository call succeeds.
- Dedup rule (FR-011): creating a notification for `(RecipientUserId, Type, ActorUserId)` where an **unread** row with the same triple already exists updates that row's `CreatedAt` (and leaves `IsRead = false`) instead of inserting a new row. A read row does not block a fresh insert.
- Marking read never deletes a row; `IsRead`/`ReadAt` are the only mutation `MarkNotificationRead`/`MarkAllNotificationsRead` perform.
- No retroactive changes: existing rows are never touched except by the dedup-bump and mark-read paths above.

## Read-model DTOs (Application layer, `GlobalScout.Application.Social.Notifications`, mirrors `SocialDtos.cs` conventions)

```csharp
public sealed record NotificationActorDto(Guid Id, string Role, UserProfileApiDto? Profile);

public sealed record NotificationDto(
    Guid Id,
    string Type,               // "ConnectionRequestReceived" | "ConnectionAccepted" | "NewFollower"
    NotificationActorDto Actor,
    Guid? RelatedEntityId,
    bool IsRead,
    DateTimeOffset CreatedAt);

public sealed record GetNotificationsResult(
    IReadOnlyList<NotificationDto> Items,
    LegacyPaginationDto Pagination,   // reuses existing LegacyPaginationDto from SocialDtos.cs
    int UnreadCount);

public sealed record MarkNotificationReadResult(Guid Id, bool IsRead, int UnreadCount);

public sealed record MarkAllNotificationsReadResult(int MarkedCount, int UnreadCount);
```

`NotificationActorDto`/profile enrichment follows the same lookup the existing `ConnectionUserSummaryDto`/`FollowingUserDto` use (role + profile joined in the repository query), so the notification list can render "who" without a second round-trip.

## State transitions

```
[created, unread] --(recipient marks read / opens it)--> [read]
[created, unread] --(same recipient+type+actor repeats)--> [created, unread] (CreatedAt bumped, no new row)
[read] --(same recipient+type+actor repeats)--> [created, unread] (new row inserted)
```

There is no transition back from read → unread, and no delete transition (rows are permanent history, per FR-008 and the edge cases).
