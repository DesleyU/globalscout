---

description: "Task list for Real-Time Notifications"
---

# Tasks: Real-Time Notifications

**Input**: Design documents from `specs/004-realtime-notifications/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/notification-endpoints.md](contracts/notification-endpoints.md), [quickstart.md](quickstart.md)

**Tests**: Included — plan.md and Constitution Principle II (Integration Testing with Real Infrastructure, NON-NEGOTIABLE) both call for unit tests on the modified/new handlers and integration tests against real Postgres for the end-to-end behavior.

**Organization**: Tasks are grouped by user story (from spec.md, in its given order: US1/US2/US4 are P1, US3 is P2) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no unmet dependencies)
- **[Story]**: Which user story this task belongs to (US1-US4)
- Exact file paths are included in every description

## Path Conventions

Existing feature-first web app layout — backend under `src/api/GlobalScout.*/`, frontend under `src/ui/apps/web/`. See plan.md's Project Structure for the full tree this was derived from.

---

## Phase 1: Setup

- [X] T001 [P] Add `@microsoft/signalr` to `src/ui/apps/web/package.json` dependencies and install it (`pnpm add @microsoft/signalr` from `src/ui/apps/web/`)

**Checkpoint**: Frontend has the SignalR client library available.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The shared `Notification` domain, persistence, push, and read-query plumbing every user story wires into. No story-specific business rules live here — only the infrastructure all four stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete. In particular, `GET api/notifications` is included here (not in US4) because every other story's integration test needs it to observe the notification it created — there is no DB-backdoor assertion helper in this test suite (`IntegrationTestFixture` only exposes an `HttpClient`), so HTTP is the only way to verify a row was persisted.

- [X] T002 [P] Create `Notification` entity in `src/api/GlobalScout.Domain/Social/Notification.cs` — plain POCO (`Id`, `RecipientUserId`, `Type`, `ActorUserId`, `RelatedEntityId` as nullable `Guid`, `IsRead`, `CreatedAt`, `ReadAt` as nullable `DateTimeOffset`), matching the flat style of sibling `Follow.cs`/`Connection.cs` (no base entity class exists in this codebase)
- [X] T003 [P] Create `NotificationType` enum in `src/api/GlobalScout.Domain/Social/NotificationType.cs` (`ConnectionRequestReceived = 0`, `ConnectionAccepted = 1`, `NewFollower = 2`)
- [X] T004 Add `DbSet<Notification> Notifications` and an inline `builder.Entity<Notification>(b => {...})` block to `src/api/GlobalScout.Infrastructure/Data/GlobalScoutDbContext.cs` (table `notifications`; indexes on `(RecipientUserId, CreatedAt)` and `(RecipientUserId, IsRead)`; `Restrict` FKs on `RecipientUserId`/`ActorUserId` to `ApplicationUser`, matching `Follow`/`Connection`/`Message`; **no** FK constraint on `RelatedEntityId`) — depends on T002, T003
- [X] T005 Generate the EF Core migration: `dotnet ef migrations add AddNotifications --project src/api/GlobalScout.Infrastructure --startup-project src/api/GlobalScout.Api --output-dir Data/Migrations` — depends on T004
- [X] T006 [P] Add `NotificationNotFound` to `src/api/GlobalScout.Application/Social/SocialErrors.cs`
- [X] T007 [P] Add `NotificationActorDto`, `NotificationDto`, `GetNotificationsResult`, `MarkNotificationReadResult`, `MarkAllNotificationsReadResult` records to `src/api/GlobalScout.Application/Social/SocialDtos.cs` (see data-model.md's "Read-model DTOs" section for exact shapes)
- [X] T008 Create `INotificationRepository` in `src/api/GlobalScout.Application/Abstractions/Persistence/INotificationRepository.cs` — `CreateAsync(NotificationType type, Guid recipientUserId, Guid actorUserId, Guid? relatedEntityId, CancellationToken)` returning `NotificationDto` (performs the unread-dedup upsert per data-model.md/research.md §4: bump `CreatedAt`+`RelatedEntityId` on an existing unread `(RecipientUserId, Type, ActorUserId)` row instead of inserting a duplicate), `GetPageAsync(Guid recipientUserId, int page, int limit, CancellationToken)` returning `(IReadOnlyList<NotificationDto> Items, int Total, int UnreadCount)`, `MarkReadAsync(Guid notificationId, Guid recipientUserId, CancellationToken)` returning `(bool Found, int UnreadCount)`, `MarkAllReadAsync(Guid recipientUserId, CancellationToken)` returning `(int MarkedCount, int UnreadCount)` — depends on T002, T003, T007
- [X] T009 [P] Create `INotificationRealtimeNotifier` in `src/api/GlobalScout.Application/Abstractions/Social/Notifications/INotificationRealtimeNotifier.cs` — `NotifyNewNotificationAsync(Guid recipientUserId, NotificationDto notification, CancellationToken)`, `NotifyReadStateChangedAsync(Guid recipientUserId, int unreadCount, CancellationToken)` — depends on T007
- [X] T010 Implement `NotificationRepository` in `src/api/GlobalScout.Infrastructure/Social/Notifications/NotificationRepository.cs`, implementing `INotificationRepository`, joining actor role/profile into `NotificationActorDto` the same way `SocialGraphRepository` builds `ConnectionUserSummaryDto`/`FollowingUserDto` — depends on T008
- [X] T011 [P] Create `NotificationHub` in `src/api/GlobalScout.Api/Social/Notifications/NotificationHub.cs` — empty `[Authorize] Hub` marker class, identical shape to `MessageHub`
- [X] T012 Implement `SignalRNotificationNotifier` in `src/api/GlobalScout.Api/Social/Notifications/SignalRNotificationNotifier.cs`, implementing `INotificationRealtimeNotifier` via `IHubContext<NotificationHub>`, sending `"ReceiveNotification"` and `"NotificationsUpdated"` respectively to `Clients.User(recipientUserId.ToString())` — depends on T009, T011
- [X] T013 Wire `src/api/GlobalScout.Api/Program.cs`: add `app.MapHub<NotificationHub>("/hubs/notifications")` next to the existing `MapHub<MessageHub>` call, and register `INotificationRepository → NotificationRepository` / `INotificationRealtimeNotifier → SignalRNotificationNotifier` in DI next to the existing message registrations — depends on T010, T012
- [X] T014 [P] Create `GetNotificationsQuery` + `GetNotificationsQueryHandler` in `src/api/GlobalScout.Application/Social/Notifications/GetNotifications/{GetNotificationsQuery.cs,GetNotificationsQueryHandler.cs}` — clamps `page`/`limit` the same way `GetConnectionsQueryHandler` does, calls `INotificationRepository.GetPageAsync`, builds `GetNotificationsResult` with a `LegacyPaginationDto` — depends on T008, T007
- [X] T015 Create `src/api/GlobalScout.Api/Endpoints/Social/Notifications/NotificationsRoutes.cs` (define `Base = "api/notifications"`, `List => Base`, `Read => $"{Base}/{{notificationId:guid}}/read"`, `ReadAll => $"{Base}/read-all"`, plus an endpoint-tags class — define all three routes now even though only List is implemented in this phase) and `GetNotificationsList.cs` (maps `GET`, resolves the caller via `HttpUser.ResolveId`, calls `IQueryHandler<GetNotificationsQuery, GetNotificationsResult>`, matches the JSON shape in contracts/notification-endpoints.md) — depends on T014
- [X] T016 [P] Create the same-origin BFF route `src/ui/apps/web/app/api/realtime/token/route.ts` — reads the HttpOnly auth cookie server-side (same `cookies()` call `lib/auth/get-session.ts` already uses), returns `{ "token": string }` JSON, `401` if no session cookie is present — depends on T001

**Checkpoint**: `Notification` is a real, queryable, pushable domain. `GET api/notifications` works (returns an empty list for everyone so far). Every user story below can now be implemented and independently verified over HTTP.

---

## Phase 3: User Story 1 - Notified live when someone sends a connection request (Priority: P1) 🎯

**Goal**: Sending a connection request persists and pushes a `ConnectionRequestReceived` notification to the receiver.

**Independent Test**: `POST api/connections/send` from User A to User B, then `GET api/notifications` as User B shows one unread `ConnectionRequestReceived` row with `actor.id = User A` and `relatedEntityId` = the new connection's id (quickstart.md Scenario 1, steps 1-3, API-only variant). Seeing it arrive live in an open browser tab additionally depends on US4's frontend hub client/bell — that visual confirmation completes once US4 also lands.

### Tests for User Story 1

- [X] T017 [P] [US1] Update `src/api/GlobalScout.Application.UnitTests/Social/Connections/SendConnection/SendConnectionRequestCommandHandlerTests.cs`: assert `INotificationRepository.CreateAsync` and `INotificationRealtimeNotifier.NotifyNewNotificationAsync` are called (with `recipient = ReceiverId`, `actor = SenderId`, `type = ConnectionRequestReceived`) on success, and `Times.Never` on every existing failure path (self-connect, unverified email, connection limit, already exists, reverse exists)

### Implementation for User Story 1

- [X] T018 [US1] Inject `INotificationRepository`/`INotificationRealtimeNotifier` into `src/api/GlobalScout.Application/Social/Connections/SendConnection/SendConnectionRequestCommandHandler.cs`; after `social.CreateConnectionAsync(...)` succeeds, call `notifications.CreateAsync(NotificationType.ConnectionRequestReceived, command.ReceiverId, command.SenderId, created.Id, cancellationToken)` then `notifier.NotifyNewNotificationAsync(command.ReceiverId, dto, cancellationToken)`, before returning `Result.Success` — depends on T017 (if writing the test first), T009, T010, T013
- [X] T019 [US1] Create `src/api/GlobalScout.Api.IntegrationTests/Social/SocialNotificationsIntegrationTests.cs` with the first scenario: register two users, send a connection request, `GET api/notifications` as the receiver, assert a `ConnectionRequestReceived` row exists with the correct `actor`/`relatedEntityId`/`isRead: false` — depends on T018, T015

**Checkpoint**: User Story 1 is fully functional and independently testable (unit + integration + API-only quickstart check).

---

## Phase 4: User Story 2 - Notified when a connection request is accepted (Priority: P1)

**Goal**: Accepting a pending connection request persists and pushes a `ConnectionAccepted` notification to the original sender. Rejecting does not.

**Independent Test**: Continuing from a pending request, `PUT api/connections/{id}/respond` with `action: "accept"`, then `GET api/notifications` as the original sender shows an unread `ConnectionAccepted` row (quickstart.md Scenario 2).

### Tests for User Story 2

- [X] T020 [P] [US2] Create `src/api/GlobalScout.Application.UnitTests/Social/Connections/RespondConnection/RespondToConnectionCommandHandlerTests.cs` (no existing test file today): assert the notifier/repository are called only when `command.Action` resolves to `Accepted` (`recipient = updated.Sender.Id`, `actor = updated.Receiver.Id`), and `Times.Never` on reject or when the connection isn't found

### Implementation for User Story 2

- [X] T021 [US2] Inject `INotificationRepository`/`INotificationRealtimeNotifier` into `src/api/GlobalScout.Application/Social/Connections/RespondConnection/RespondToConnectionCommandHandler.cs`; after `social.RespondToPendingConnectionAsync(...)` succeeds **and** `status == ConnectionStatus.Accepted`, call `notifications.CreateAsync(NotificationType.ConnectionAccepted, updated.Sender.Id, updated.Receiver.Id, updated.Id, cancellationToken)` then `notifier.NotifyNewNotificationAsync(updated.Sender.Id, dto, cancellationToken)` — depends on T020, T009, T010, T013
- [X] T022 [US2] Extend `SocialNotificationsIntegrationTests.cs` with the accept scenario (assert the sender receives a `ConnectionAccepted` notification) and a reject scenario (assert no notification is created) — depends on T021, T019

**Checkpoint**: User Stories 1 and 2 both independently functional.

---

## Phase 5: User Story 3 - Notified about new followers (Priority: P2)

**Goal**: A successful follow persists and pushes a `NewFollower` notification to the followed user, with rapid repeat follow/unfollow/follow cycles deduped while unread (FR-011).

**Independent Test**: `POST api/follow/{userId}/follow` from an eligible follower, then `GET api/notifications` as the target shows an unread `NewFollower` row (quickstart.md Scenario 3); repeating follow/unfollow/follow before it's read leaves exactly one row, its `CreatedAt` bumped (quickstart.md Scenario 7).

### Tests for User Story 3

- [X] T023 [P] [US3] Update `src/api/GlobalScout.Application.UnitTests/Social/Follow/FollowUserCommandHandlerTests.cs`: assert the notifier/repository are called on a successful follow (`recipient = FollowingUserId`, `actor = FollowerId`), and `Times.Never` on self-follow, not-found, eligibility failure, or already-following

### Implementation for User Story 3

- [X] T024 [US3] Inject `INotificationRepository`/`INotificationRealtimeNotifier` into `src/api/GlobalScout.Application/Social/Follow/FollowUserCommandHandler.cs`; after `social.CreateFollowAsync(...)` succeeds, call `notifications.CreateAsync(NotificationType.NewFollower, command.FollowingUserId, command.FollowerId, created.Id, cancellationToken)` then `notifier.NotifyNewNotificationAsync(command.FollowingUserId, dto, cancellationToken)` — depends on T023, T009, T010, T013
- [X] T025 [US3] Extend `SocialNotificationsIntegrationTests.cs` with: (a) the new-follower scenario, (b) the dedup scenario — follow, unfollow, re-follow before reading, assert exactly one unread `NewFollower` row. (The "mark read then repeat -> new row" sub-case is deferred to T030 once the mark-read endpoint exists.) — depends on T024, T022

**Checkpoint**: All three notification-producing stories (US1-US3) are independently functional and covered by both unit and integration tests.

---

## Phase 6: User Story 4 - Browse and manage a notification history (Priority: P1)

**Goal**: Users can view their notification history (already built in Foundational), mark individual/all notifications read, and see it all live in the header bell — replacing the hardcoded badge. This phase is also what makes US1-US3's "sees a live notification" claim visually true in a browser, since it's where the frontend hub client and panel actually get built.

**Independent Test**: Generate a few notifications for a user (via US1-US3 flows), open the notification panel, confirm read/unread state and ordering, click one to mark it read (badge decrements), mark-all-as-read (badge hits zero), and confirm a second open tab for the same user reflects both the live push and the read-state change without a manual refresh (quickstart.md Scenario 5).

### Tests for User Story 4

- [X] T026 [P] [US4] Add unit tests for `MarkNotificationReadCommandHandler` and `MarkAllNotificationsReadCommandHandler` in `src/api/GlobalScout.Application.UnitTests/Social/Notifications/{MarkNotificationReadCommandHandlerTests.cs,MarkAllNotificationsReadCommandHandlerTests.cs}` — assert `NotFound` when the repository reports no match, success + correct `unreadCount` otherwise, and that `INotificationRealtimeNotifier.NotifyReadStateChangedAsync` is called on success

### Implementation for User Story 4

- [X] T027 [P] [US4] Create `MarkNotificationReadCommand` + `MarkNotificationReadCommandHandler` in `src/api/GlobalScout.Application/Social/Notifications/MarkNotificationRead/{MarkNotificationReadCommand.cs,MarkNotificationReadCommandHandler.cs}` — calls `INotificationRepository.MarkReadAsync`, returns `SocialErrors.NotificationNotFound` on no match, else `MarkNotificationReadResult` and calls the notifier — depends on T008, T009, T007
- [X] T028 [P] [US4] Create `MarkAllNotificationsReadCommand` + `MarkAllNotificationsReadCommandHandler` in `src/api/GlobalScout.Application/Social/Notifications/MarkAllNotificationsRead/{MarkAllNotificationsReadCommand.cs,MarkAllNotificationsReadCommandHandler.cs}` — calls `INotificationRepository.MarkAllReadAsync`, returns `MarkAllNotificationsReadResult`, calls the notifier — depends on T008, T009, T007
- [X] T029 [US4] Create `PutNotificationsRead.cs` and `PutNotificationsReadAll.cs` in `src/api/GlobalScout.Api/Endpoints/Social/Notifications/`, mapping the routes already defined in `NotificationsRoutes.cs` (T015) to the two new command handlers — depends on T027, T028, T015
- [X] T030 [US4] Finish `SocialNotificationsIntegrationTests.cs`: mark-one-read, mark-all-read, and re-fetching `GET api/notifications` afterward to confirm `unreadCount` and per-row `isRead` are accurate (SC-003); also complete the deferred read/re-dedup sub-case from T025 — depends on T029, T025
- [X] T031 [P] [US4] Create `src/ui/apps/web/lib/api/notifications-browser.ts` — same-origin fetch client (list/mark-read/mark-all-read), mirroring the style of `lib/api/admin-browser.ts` etc. (`credentials: "include"`, calling `/api/notifications*`) — depends on T029
- [X] T032 [US4] Create `src/ui/apps/web/hooks/use-notifications-hub.ts` — `@microsoft/signalr` `HubConnectionBuilder` targeting `` `${getPublicApiOrigin()}/hubs/notifications` ``, `accessTokenFactory` calling `GET /api/realtime/token`, `.withAutomaticReconnect()`, listens for `"ReceiveNotification"` (prepend to list, bump unread count) and `"NotificationsUpdated"` (replace unread count) — depends on T016, T031
- [X] T033 [US4] Rewrite the bell in `src/ui/apps/web/components/layout/dashboard-header.tsx`: replace the hardcoded `<Bell>` + static `4` badge with a real unread count sourced from `notifications-browser.ts` (initial fetch) + `use-notifications-hub.ts` (live updates), and a panel listing notifications with click-to-mark-read and mark-all-read, deep-linking per the `Type → RelatedEntityId` table in data-model.md — depends on T031, T032

**Checkpoint**: All four user stories independently functional; `quickstart.md`'s full 7-scenario walkthrough is runnable end-to-end in a real browser.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [~] T034 [P] Run all of `quickstart.md`'s 7 scenarios manually against a running stack (`dotnet run --project src/api/GlobalScout.AppHost` or `docker compose up`), including the "receiving a push must not mark read" check added to Scenario 1 — **partially done**: scenarios 1-2-3-5-6-7's underlying logic is exercised end-to-end by the automated integration tests (real Postgres) instead of a manual run; no browser was available in this environment to click through the live-push/bell-UI experience (scenario 4's "reopen the app later" and the visual live-toast behavior specifically) — recommend a manual pass before shipping
- [X] T035 [P] Run `dotnet test` (all of `GlobalScout.Application.UnitTests` and `GlobalScout.Api.IntegrationTests`) and `pnpm typecheck && pnpm lint` from `src/ui/apps/web/`, fix any fallout — done: 168/168 unit tests pass, all 8 new + 19 pre-existing Follow integration tests pass; 11 pre-existing Connections/Messages integration test failures confirmed unrelated (email-verification gap predating this feature, reproduced identically on `main` before any change here); typecheck/lint/build are clean for every file this feature touched, with one pre-existing unrelated type error blocking a full `pnpm build` (`features/statistics/statistics-content.tsx`, untouched by this feature)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies.
- **Foundational (Phase 2)**: depends on Setup (T016 needs T001) — **blocks every user story**.
- **User Stories (Phases 3-6)**: all depend on Foundational completion.
  - US1, US2, US3 can proceed in parallel with each other (different handler files) once Foundational is done — they only share the append-only `SocialNotificationsIntegrationTests.cs` file, so treat T019/T022/T025 as sequential on each other regardless of story parallelism (same file).
  - US4 can start its Application/Api-layer tasks (T026-T029) in parallel with US1-US3, but its integration-test task (T030) and frontend tasks (T031-T033) are easiest to finish last since T030 closes out the shared integration test file and the frontend bell is more useful to build once there's real data to look at.
- **Polish (Phase 7)**: depends on all four stories being complete.

### Within Each Story

- Tests before the handler edit they cover (write the mock-assertion test, watch it fail, then wire the handler).
- The shared `SocialNotificationsIntegrationTests.cs` file is appended to sequentially by story (T019 → T022 → T025 → T030) — do not parallelize edits to it across stories.

### Parallel Opportunities

- Phase 2: T002/T003, T006/T007, T009/T011/T014/T016 (each independent of the others at that point) can run in parallel.
- Phase 3-5: T017/T020/T023 (the three test-file updates) can all run in parallel with each other, and their corresponding handler-wiring tasks (T018/T021/T024) can proceed in parallel across stories since they touch different handler files.
- Phase 6: T026, T027, T028, T031 can run in parallel (independent new files).

---

## Parallel Example: Foundational Phase

```bash
# Domain layer, independent files:
Task: "Create Notification entity in src/api/GlobalScout.Domain/Social/Notification.cs"
Task: "Create NotificationType enum in src/api/GlobalScout.Domain/Social/NotificationType.cs"

# Once T007 (DTOs) lands, these three are independent of each other:
Task: "Create INotificationRealtimeNotifier in src/api/GlobalScout.Application/Abstractions/Social/Notifications/INotificationRealtimeNotifier.cs"
Task: "Create NotificationHub in src/api/GlobalScout.Api/Social/Notifications/NotificationHub.cs"
Task: "Create the same-origin BFF route src/ui/apps/web/app/api/realtime/token/route.ts"
```

## Parallel Example: Stories 1-3 together

```bash
# Three independent handler files, three independent test-file updates:
Task: "Update SendConnectionRequestCommandHandlerTests.cs to assert notification wiring"
Task: "Create RespondToConnectionCommandHandlerTests.cs to assert notification wiring"
Task: "Update FollowUserCommandHandlerTests.cs to assert notification wiring"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (Setup) + Phase 2 (Foundational) — this alone stands up the entire `Notification` domain, persistence, hub, and list endpoint.
2. Complete Phase 3 (US1).
3. **STOP and VALIDATE**: `POST api/connections/send` → `GET api/notifications` shows the row. This alone proves the end-to-end persistence + query path works; live browser push and read-state UI come later.

### Incremental Delivery

1. Setup + Foundational → notification domain exists and is queryable.
2. Add US1 → connection-request notifications flow end-to-end (API-verifiable).
3. Add US2 → connection-accepted notifications flow end-to-end.
4. Add US3 → new-follower notifications + dedup, fully covered.
5. Add US4 → read/read-all endpoints, and — critically — the frontend bell/panel/hub client that makes US1-US3's live-push promise visible and lets a user actually manage their notifications. This is the increment where the feature becomes user-facing rather than API-only.
6. Polish → full manual quickstart pass + test suite green.

### Suggested Team Split

With multiple developers, once Foundational is done: one person on US1+US2 (both touch Connections handlers, share the integration test file, natural to pair), one on US3 (Follow handler + dedup, the trickiest logic), one starting US4's backend (T026-T029, independent of the others) and then the frontend (T031-T033) once there's something to point it at.
