# Implementation Plan: Real-Time Notifications

**Branch**: `main` (trunk-based repo — see Constitution Git & Deploy Workflow; no feature branch is created) | **Date**: 2026-09-15 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/004-realtime-notifications/spec.md`

## Summary

Build a persisted `Notification` domain backing a real notification center: connection-request-received, connection-accepted, and new-follower events each create a durable row and push live over a new SignalR hub (`/hubs/notifications`) to the recipient's active sessions. Backend follows the existing chat-notification precedent exactly — no domain-event bus exists or is introduced; `FollowUserCommandHandler`, `SendConnectionRequestCommandHandler`, and `RespondToConnectionCommandHandler` each call a new `INotificationRepository` (persist, with unread-dedup upsert) then `INotificationRealtimeNotifier` (push) directly, mirroring `SendMessageCommandHandler` → `IMessageRealtimeNotifier`. Frontend gets a real notification bell (replacing the hardcoded badge) backed by a REST history/read-state API and a `@microsoft/signalr` client — which requires one new piece of infrastructure not yet present anywhere in the app: a same-origin BFF route (`GET /api/realtime/token`) to hand the browser the HttpOnly-cookie-held JWT on demand for the hub handshake, since no client-side code has ever had direct token access before now.

## Technical Context

**Language/Version**: C# / .NET 10 (`src/api/*.csproj` → `net10.0`); TypeScript / Next.js 16 (`src/ui/apps/web/`)

**Primary Dependencies**: ASP.NET Core minimal APIs + SignalR (already used for chat's `MessageHub`), EF Core (PostgreSQL provider), custom `ICommand`/`IQuery`/`ICommandHandler`/`IQueryHandler`/`Result` pattern in `GlobalScout.SharedKernel`; frontend: React 19 / Next 16 App Router, TanStack Query 5, and a new dependency `@microsoft/signalr` (not currently in `src/ui/apps/web/package.json`)

**Storage**: PostgreSQL — one new table `notifications` (new migration; no changes to `follows`/`connections`)

**Testing**: xUnit unit tests (`GlobalScout.Application.UnitTests`) for the dedup/upsert repository logic and the three modified handlers (mocked `INotificationRepository`/`INotificationRealtimeNotifier`, matching `SendMessageCommandHandlerTests`'s mock-injection style); xUnit + Testcontainers integration tests (`GlobalScout.Api.IntegrationTests`, real Postgres) extending `Social/` with a new `SocialNotificationsIntegrationTests.cs` that drives the real follow/connection endpoints and asserts persisted notification rows and REST read/list responses — SignalR push itself needs no special test double, since `IHubContext.Clients.User(...).SendAsync(...)` is a harmless no-op against a `WebApplicationFactory` with no connected client

**Target Platform**: Linux containers (Docker Compose / Aspire AppHost); browser (Next.js client components) for the new bell UI and hub client

**Project Type**: Web application (existing ASP.NET Core API + Next.js frontend) — this feature spans both, unlike the backend-only 003 follow-eligibility feature

**Performance Goals**: SC-001 — live notification visible within 5 seconds of the triggering event for an active session (achieved for free: the push happens synchronously in the same request that persists the event, well under 5s; the only latency is the client's own SignalR round-trip)

**Constraints**: Must not alter existing Follow/Connections success paths or error contracts (additive-only handler changes); must not introduce an FK constraint from `Notification.RelatedEntityId` to `follows`/`connections` (a notification must outlive the row it references, per spec edge cases); must not persist the raw JWT anywhere in browser storage — `/api/realtime/token` is fetched on demand into SignalR's in-memory `accessTokenFactory`, never `localStorage`/`sessionStorage`; must follow feature-first architecture (Constitution Principle I) — new logic lives under `Social/Notifications/`, not a generic/shared location

**Scale/Scope**: One new domain entity + enum, one new repository abstraction + implementation, one new realtime-notifier abstraction + implementation, one new hub, 3 new endpoints, edits to 3 existing command handlers (2 lines each), one new EF migration, one new frontend BFF route, one new frontend API client module, one new SignalR client hook, one bell/panel UI rewrite. No changes to the Follow or Connections domain models themselves.

**Frontend note**: The header bell (`src/ui/apps/web/components/layout/dashboard-header.tsx`) is currently fully decorative — a static `<Bell>` icon with a hardcoded `4` badge and no click handler. This plan replaces that static markup with a real notification panel wired to the new REST + hub client. `getPublicApiOrigin()` (`lib/env/index.ts`) already exists, unused, with a comment anticipating exactly this use ("API origin for SignalR and other non-/api browser traffic") — this is its first caller.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Feature-First Clean Architecture (NON-NEGOTIABLE)** — PASS. All new backend code lives under `Application/Social/Notifications/`, `Api/Social/Notifications/` (hub + notifier), `Api/Endpoints/Social/Notifications/`, and `Infrastructure/Social/Notifications/` — mirroring the existing `Social/Messages/` and `Social/Follow/` layouts exactly, no technical-folder placement.
- **II. Integration Testing with Real Infrastructure (NON-NEGOTIABLE)** — PASS. New integration coverage runs against the real Postgres Testcontainer via the existing `IntegrationTestFixture`, exercising the real endpoints end-to-end (follow/connect → assert persisted + returned notification). No mocking of the database.
- **III. Pragmatic Test Coverage** — PASS. Tests are added for new real behavior: the dedup/upsert rule (a genuinely subtle invariant worth locking down), the three handler wiring points, and the REST read/list/mark-read endpoints. No reflexive scaffolding tests.
- **IV. Minimal, Convention-Matching Diffs** — PASS. `FollowUserCommandHandler`, `SendConnectionRequestCommandHandler`, `RespondToConnectionCommandHandler` each get a 2-constructor-param + 2-line addition, not a rewrite. Sibling files read before designing this plan: `SendMessageCommandHandler.cs`/`IMessageRealtimeNotifier.cs`/`SignalRMessageNotifier.cs`/`MessageHub.cs` (the realtime-push precedent), `SocialDtos.cs`/`GetConnectionsQueryHandler.cs` (DTO + query-handler + pagination conventions), `GlobalScoutDbContext.cs` (inline EF configuration convention), `lib/api/follow.ts`/`messages.ts`/`client.ts` (frontend API-client conventions).
- **V. Production URL & CORS Invariants (NON-NEGOTIABLE)** — Relevant but not violated: the new hub is mapped under the existing `/hubs/*` prefix (already covered by prod CORS/ALB routing for `/hubs/messages`), and the browser connects to it via `getPublicApiOrigin()` (already resolves to the canonical `https://api.globalscout.eu` origin in prod, per its existing implementation) — no new relative-`/api` mistake, no new origin introduced. Flagged here rather than "N/A" because a hub route is exactly the kind of surface Principle V warns about; `docs/AWS-infrastructure_setup_documentation.md` should be skimmed before deploying if `/hubs/*` CORS/ALB rules turn out to need a second path entry (expected: none, since the prefix is already allowed for chat).

No violations. Complexity Tracking section is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/004-realtime-notifications/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── notification-endpoints.md
└── tasks.md             # Phase 2 output (/speckit-tasks — not created here)
```

### Source Code (repository root)

```text
src/api/
├── GlobalScout.Domain/
│   └── Social/
│       ├── Notification.cs                    # NEW — POCO entity (see data-model.md)
│       └── NotificationType.cs                # NEW — enum
├── GlobalScout.Application/
│   ├── Abstractions/Persistence/
│   │   └── INotificationRepository.cs         # NEW — CreateAsync (with dedup upsert), GetPageAsync, MarkReadAsync, MarkAllReadAsync, GetUnreadCountAsync
│   ├── Abstractions/Social/Notifications/
│   │   └── INotificationRealtimeNotifier.cs    # NEW — NotifyNewNotificationAsync, NotifyReadStateChangedAsync
│   └── Social/
│       ├── SocialErrors.cs                     # + NotificationNotFound
│       ├── SocialDtos.cs                       # + NotificationDto, NotificationActorDto, GetNotificationsResult, MarkNotificationReadResult, MarkAllNotificationsReadResult
│       ├── Follow/FollowUserCommandHandler.cs  # + inject + call notification repo/notifier after CreateFollowAsync succeeds
│       ├── Connections/SendConnection/SendConnectionRequestCommandHandler.cs   # + same, after CreateConnectionAsync
│       ├── Connections/RespondConnection/RespondToConnectionCommandHandler.cs  # + same, only when status == Accepted
│       └── Notifications/                      # NEW feature folder
│           ├── GetNotifications/GetNotificationsQuery.cs
│           ├── GetNotifications/GetNotificationsQueryHandler.cs
│           ├── MarkNotificationRead/MarkNotificationReadCommand.cs
│           ├── MarkNotificationRead/MarkNotificationReadCommandHandler.cs
│           ├── MarkAllNotificationsRead/MarkAllNotificationsReadCommand.cs
│           └── MarkAllNotificationsRead/MarkAllNotificationsReadCommandHandler.cs
├── GlobalScout.Infrastructure/
│   ├── Data/
│   │   ├── GlobalScoutDbContext.cs             # + DbSet<Notification>, + builder.Entity<Notification>(...) inline config
│   │   └── Migrations/                         # + new AddNotifications migration
│   └── Social/Notifications/
│       └── NotificationRepository.cs           # NEW — implements INotificationRepository
├── GlobalScout.Api/
│   ├── Program.cs                              # + app.MapHub<NotificationHub>("/hubs/notifications"); + DI registration
│   ├── Social/Notifications/
│   │   ├── NotificationHub.cs                  # NEW — empty [Authorize] Hub marker, like MessageHub
│   │   └── SignalRNotificationNotifier.cs      # NEW — implements INotificationRealtimeNotifier via IHubContext<NotificationHub>
│   └── Endpoints/Social/Notifications/
│       ├── NotificationsRoutes.cs
│       ├── GetNotificationsList.cs
│       ├── PutNotificationsRead.cs
│       └── PutNotificationsReadAll.cs
├── GlobalScout.Application.UnitTests/
│   └── Social/Notifications/
│       ├── NotificationDedupTests.cs           # NEW — repository-level dedup rule (or handler-level if the rule is easier to unit test through a fake repo)
│       ├── FollowUserCommandHandlerTests.cs     # + assert notifier called on success, not called on eligibility failure
│       ├── SendConnectionRequestCommandHandlerTests.cs  # + same
│       └── RespondToConnectionCommandHandlerTests.cs    # NEW (no existing test file today) — assert notifier called only on accept
└── GlobalScout.Api.IntegrationTests/
    └── Social/
        └── SocialNotificationsIntegrationTests.cs  # NEW — real Postgres: follow/connect/respond → assert notification rows + REST responses

src/ui/apps/web/
├── package.json                                # + "@microsoft/signalr"
├── app/api/realtime/token/route.ts             # NEW — reads the HttpOnly auth cookie server-side, returns { token } for hub auth
├── lib/api/notifications-browser.ts            # NEW — same-origin fetch client (list/read/read-all), mirrors admin-browser.ts style
├── hooks/use-notifications-hub.ts              # NEW — @microsoft/signalr connection using accessTokenFactory -> /api/realtime/token
└── components/layout/dashboard-header.tsx      # rewritten bell: real unread count + panel, driven by the above
```

**Structure Decision**: Existing feature-first backend layout is extended with one new sibling feature folder (`Social/Notifications/`) at every layer, matching `Social/Follow/` and `Social/Messages/`. Three existing handlers get additive edits only. Frontend gets one new BFF route, one new API client module, one new hook, and a rewrite of the one component that was already a placeholder — no new frontend feature folder is needed since the bell lives in the existing shared dashboard header, not a page-level feature.

## Complexity Tracking

*No Constitution Check violations — section not applicable.*
