# Quickstart: Validating Real-Time Notifications

## Prerequisites

- `dotnet run --project src/api/GlobalScout.AppHost` (Aspire AppHost — brings up Postgres, S3 Ministack, API, and Next.js together with correct CORS/env wiring), **or** `docker compose up` from repo root.
- Two logged-in browser sessions (or one normal + one incognito window) as two different users with roles that are eligible to follow/connect each other (e.g. two `Player` accounts, or a `ScoutAgent` following a `Player` — see [spec.md](../003-follow-role-restrictions/spec.md) for the follow-eligibility rules already in effect).
- A new EF Core migration for the `notifications` table must be applied — local `Development`/`IntegrationTesting` environments auto-migrate on API startup, so simply starting the API after the migration is added is sufficient.

## Scenario 1 — Live connection-request notification (FR-001, FR-004, SC-001)

1. User A and User B both have the app open (User B on the notification bell / dashboard).
2. User A sends User B a connection request.
3. **Expected**: within ~5 seconds, User B sees a live notification appear (no refresh) and the header bell's unread badge increments. Confirm via `GET api/notifications` that a `ConnectionRequestReceived` row exists for User B with `actor.id = User A`, `relatedEntityId` = the new connection's id.
4. **Also confirm this does NOT happen**: receiving the live push must not mark the notification read. Re-fetch `GET api/notifications` (or check the DB row) and confirm `isRead: false` still — it should only flip once User B explicitly clicks it or hits "mark all as read" (Scenario 5). Merely being delivered live vs. found later in history must leave `isRead` identical either way.

## Scenario 2 — Live accepted-connection notification (FR-002)

1. Continuing from Scenario 1: User B accepts the pending request.
2. **Expected**: User A (if active) receives a live `ConnectionAccepted` notification. Confirm via `GET api/notifications` for User A.

## Scenario 3 — New-follower notification (FR-003)

1. User A (eligible role) follows User B.
2. **Expected**: User B receives a live `NewFollower` notification referencing User A and the new follow's id.

## Scenario 4 — Offline durability (FR-005, SC-002)

1. User B closes the app entirely (no live hub connection).
2. User A follows User B (or sends/accepts a connection).
3. User B reopens the app later and opens the notification panel.
4. **Expected**: the notification is present in history as unread — no push was possible, but the durable row exists.

## Scenario 5 — Read state and unread count (FR-006, FR-007, SC-003)

1. User B has 2+ unread notifications; the header bell shows the correct count.
2. User B opens the notification panel and clicks one notification.
3. **Expected**: that notification flips to read, the unread badge decrements by 1, and (per FR-008) a second open tab/device for User B also updates its badge without a manual refresh (via the `NotificationsUpdated` hub event).
4. User B clicks "mark all as read" (or the equivalent bulk action).
5. **Expected**: all notifications show read, badge goes to 0 in every open session.

## Scenario 6 — No notification for a disallowed action (FR-010)

1. User A attempts to follow a user whose role makes the follow ineligible (rejected per the [003 follow-eligibility spec](../003-follow-role-restrictions/spec.md)).
2. **Expected**: the follow attempt fails with the existing domain error, and no notification is created for the target user — confirm via `GET api/notifications` for the target showing no new row.

## Scenario 7 — Duplicate suppression (FR-011, SC-005)

1. User A follows, unfollows, then re-follows User B in quick succession, all before User B reads the resulting notification.
2. **Expected**: User B has exactly one unread `NewFollower` notification for User A (its `CreatedAt` reflects the latest follow), not three.
3. If User B reads that notification, then User A repeats follow/unfollow/follow again, a second, distinct notification is created this time (the read one is not reused).

## Verifying without the UI (API-only)

Each scenario above can be exercised purely via REST (`POST api/follow/{userId}/follow`, `POST api/connections/send`, `PUT api/connections/{id}/respond`) plus `GET api/notifications`, without a live SignalR connection — this validates persistence/dedup/read-state independent of the push transport, which is the split covered by unit tests (dedup/eligibility logic) vs. integration tests (real Postgres-backed persistence) per Constitution Principles II/III. Live-push behavior (Scenarios 1-3, 5) is the part that additionally needs a real or scripted SignalR client to observe `ReceiveNotification`/`NotificationsUpdated` events — the `contracts/notification-endpoints.md` file documents their exact payload shape for that purpose.
