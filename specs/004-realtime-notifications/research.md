# Phase 0 Research: Real-Time Notifications

## 1. How new notifications get created and pushed

**Decision**: No domain-event bus or MediatR notification pipeline exists in this codebase (confirmed: zero matches for `MediatR`, `IDomainEvent`, `INotificationHandler`, outbox pattern anywhere in `src/api`). The existing real-time feature (chat) does not use one either — `SendMessageCommandHandler` calls `IMessageRepository.CreateMessageAsync(...)` for persistence, then calls `IMessageRealtimeNotifier.NotifyNewMessageAsync(...)` directly, in sequence, inside the same `Handle` method (`src/api/GlobalScout.Application/Social/Messages/SendMessage/SendMessageCommandHandler.cs:49-55`).

This feature follows the identical shape: inject `INotificationRepository` (persistence, Application.Abstractions.Persistence) and `INotificationRealtimeNotifier` (push, Application.Abstractions.Social.Notifications) directly into the three existing handlers that produce the relevant events — `FollowUserCommandHandler`, `SendConnectionRequestCommandHandler`, `RespondToConnectionCommandHandler` — and call both, in order, after the existing repository write succeeds and before returning `Result.Success`.

**Rationale**: Matches the one existing precedent in this codebase exactly (Constitution Principle IV — match convention, smallest diff). Introducing a domain-event bus or outbox for three call sites would be new infrastructure not otherwise used anywhere in the app.

**Alternatives considered**:
- MediatR `INotification` + handler — rejected: no MediatR package referenced in the solution at all; would be new infra for zero other benefit at this scale (3 call sites).
- Outbox table + background dispatcher — rejected: massive overkill for in-process, same-transaction-adjacent side effects; nothing else in the app needs at-least-once cross-process delivery guarantees yet.

## 2. SignalR hub and push mechanism

**Decision**: Add a second hub, `NotificationHub` (`src/api/GlobalScout.Api/Social/Notifications/NotificationHub.cs`), an empty `[Authorize] Hub` marker class exactly like `MessageHub`, mapped at `app.MapHub<NotificationHub>("/hubs/notifications")` alongside the existing `app.MapHub<MessageHub>("/hubs/messages")` in `Program.cs`. Push uses `IHubContext<NotificationHub>.Clients.User(recipientUserId.ToString()).SendAsync(...)` — identical per-user targeting to `SignalRMessageNotifier`. No new groups, no new auth wiring: hub connections under `/hubs/*` already get JWT-via-query-string authentication for free from the existing `JwtBearerEvents.OnMessageReceived` check in `GlobalScout.Infrastructure/DependencyInjection.cs` (path prefix match on `/hubs`, not the specific hub name).

**Rationale**: Reuses 100% of the existing SignalR auth wiring; a second hub keeps notification traffic (schema: `ReceiveNotification`, `NotificationsUpdated`) separate from chat traffic (`ReceiveMessage`) without touching `MessageHub`, matching feature-first separation (Principle I: new logic lives under `Social/Notifications/`, not bolted onto `Social/Messages/`).

**Alternatives considered**:
- Reuse `MessageHub` for both chat and notification pushes — rejected: conflates two unrelated feature areas in one hub/class, violates feature-first separation for no benefit (SignalR hubs are cheap; one path per concern is the existing pattern already established by having a dedicated `MessageHub`).

## 3. Browser-side SignalR authentication (the actual open question)

**Problem**: The existing hub auth pattern expects a raw JWT on the query string (`?access_token=...`). Today, the frontend JWT is stored **only** in an HttpOnly cookie (`AUTH_TOKEN_COOKIE = "token"`, set in `app/api/auth/sign-in/route.ts`) and is read back exclusively in server-side Next.js code (`cookies()` in route handlers / server components) to build a `Bearer` header for the .NET API. No client-side JS anywhere in `src/ui/apps/web` has ever had access to the raw token — confirmed no `localStorage`/`sessionStorage` usage, no token in any login response body, no existing "get my token" BFF route. This is a real, new gap: the chat feature (`/hubs/messages`) has a backend hub already, but the frontend has never connected to it either, so there's no existing pattern to copy for the browser side.

**Decision**: Add one new same-origin BFF route, `GET /api/realtime/token` (`app/api/realtime/token/route.ts`), that reads the HttpOnly cookie server-side (same `cookies()` call already used in `lib/auth/get-session.ts`) and returns `{ "token": "<jwt>" }` as JSON — but only when a valid session cookie is present (401 otherwise, same as any other authenticated BFF route). The browser's SignalR client uses `@microsoft/signalr`'s `accessTokenFactory` option to call this route on-demand (SignalR invokes it on initial connect and on every reconnect), so the raw token is fetched fresh, held only in the SignalR client's in-memory state, and never written to any browser storage.

```ts
new signalR.HubConnectionBuilder()
  .withUrl(`${getPublicApiOrigin()}/hubs/notifications`, {
    accessTokenFactory: async () => {
      const res = await fetch("/api/realtime/token", { credentials: "include" });
      const { token } = await res.json();
      return token;
    },
  })
  .withAutomaticReconnect()
  .build();
```

`getPublicApiOrigin()` (`src/ui/apps/web/lib/env/index.ts`) already exists for exactly this purpose (its comment reads "API origin for SignalR and other non-/api browser traffic") but has zero callers today — this feature is its first real use.

**Rationale**: Smallest possible new surface (one route, no new cookie, no new token type/lifetime) that unblocks a browser-side hub connection using the exact mechanism the backend hub already implements. Reuses the existing token's existing expiry — no new refresh/rotation logic needed.

**Alternatives considered**:
- Mint a separate short-lived "hub ticket" token — rejected: adds a second token type/signing concern to the backend for no functional gain at this scale; the existing JWT's expiry is already short-lived enough for interactive sessions, and `accessTokenFactory` re-fetches on every reconnect anyway.
- Make the cookie itself non-HttpOnly so client JS can read it directly — rejected: strictly worse security posture (permanently exposes the token to any XSS, not just for the duration of an in-memory hub connection); also a much bigger behavior change touching every authenticated request, not just SignalR.
- Proxy the whole SignalR connection through a Next.js API route (WebSocket proxy) — rejected: Next.js route handlers don't support long-lived WebSocket upgrades in this deployment model (standard Node/Vercel-style serverless handler, not a custom server); would require infrastructure changes out of scope for this feature.

## 4. Duplicate/redundant notification suppression (FR-011)

**Decision**: `INotificationRepository.CreateAsync(...)` performs an upsert: before inserting, it looks for an existing **unread** notification with the same `(RecipientUserId, Type, ActorUserId)`. If one exists, it bumps that row's `CreatedAt` to now (so it resurfaces at the top of the list) and returns it as-is, instead of inserting a second row. If none exists (or the existing one was already read), it inserts a new row.

**Rationale**: Connection-request and connection-accepted events are structurally single-fire per connection (the `connections` table has a unique `(SenderId, ReceiverId)` index enforced since the existing Follow/Connections features, and a connection only transitions pending→accepted once), so duplication in practice only matters for rapid follow/unfollow/follow cycles on the same pair — which the unread-upsert rule directly covers: a still-unread "new follower" notification just gets refreshed rather than multiplied, and once the user reads it, a genuinely new follow later creates a fresh one. This is a real, testable behavior (satisfies Constitution Principle III — tests cover real behavior) without introducing time-window heuristics or a separate dedup/outbox table.

**Alternatives considered**:
- Time-window debounce (e.g. "no duplicate within 5 minutes") — rejected: arbitrary threshold, harder to test deterministically, and doesn't match the actual edge case described in the spec (rapid toggling while unread), which the read/unread state already captures naturally.
- Delete-then-recreate on unfollow — rejected: spec explicitly says notifications must not be silently deleted when the underlying event is reversed (Edge Cases: "notification still records that the event occurred; it is not silently deleted").

## 5. Persistence shape and migration approach

**Decision**: New `Notification` POCO entity in `GlobalScout.Domain.Social` (same flat placement as sibling `Follow`/`Connection`/`Message` — no base `Entity`/`AggregateRoot` class exists in this codebase to inherit from), configured inline in `GlobalScoutDbContext.OnModelCreating` (no `IEntityTypeConfiguration<T>` classes exist anywhere in this project — every entity is configured in one inline `builder.Entity<T>(b => {...})` block), table `notifications` (snake_case, matching `UseSnakeCaseNamingConvention()`). `RelatedEntityId` is a plain nullable `Guid` column with **no FK constraint** to `connections`/`follows` (so it survives the referenced row being deleted, per the "deep link degrades gracefully" edge case). One new migration is added via:
```
dotnet ef migrations add AddNotifications --project src/api/GlobalScout.Infrastructure --startup-project src/api/GlobalScout.Api --output-dir Data/Migrations
```
(the only migration authoring path this repo has — confirmed by the single existing `20260915064216_InitialCreate` migration and `Microsoft.EntityFrameworkCore.Design` being referenced only in `GlobalScout.Api` and `GlobalScout.Infrastructure`). The separate `GlobalScout.Migrator` project only *applies* migrations at deploy time; local `Development`/`IntegrationTesting` environments auto-migrate on startup already (`Program.cs`), so no extra local step is needed beyond generating the migration file.

**Rationale**: Zero new architectural concepts — this is the existing, only pattern in the codebase for entities/config/migrations.
