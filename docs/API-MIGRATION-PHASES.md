# Legacy Node.js API → .NET migration (phases)

Use this doc to scope **one chat per phase**. Source of truth for behaviour is the Express app under `backend/src/` (routes + controllers).

**Stack:** [`GlobalScout.Api`](src/GlobalScout/GlobalScout.Api) (minimal APIs + `IEndpoint`), Application (commands/queries + handlers), Infrastructure (EF / Identity).

---

## Phase 1 — Users & auth polish — **DONE**

**Goal:** SPA-facing user profile flows and public profile view parity with legacy.

**Delivered (high level):**

- `GET/PUT /api/users/profile`, `POST /api/users/avatar`, `GET` search / recommendations / profile visitors, `GET /api/users/{id}` (auth, `{ user: … }`, visits, basic-tier profile masking).
- `POST /api/auth/logout` (204).
- `IUserDirectoryRepository`, `IAvatarStorage` + `AvatarStorageOptions` (host in API), validation decorator, `app.MapEndpoints()`.

**Legacy reference:** `backend/src/routes/users.js`, `auth.js` (logout optional in Node).

---

## Phase 2 — Connections & follow

**Goal:** Social graph APIs.

**Endpoints (legacy prefixes):**

- `/api/connections` — send, respond, list, pending requests (`backend/src/routes/connections.js`).
- `/api/follow` — follow/unfollow, followers, following, status, stats (`backend/src/routes/followRoutes.js`).

**Data:** `Connection`, `Follow` entities already in [`GlobalScoutDbContext`](src/GlobalScout/GlobalScout.Infrastructure/Data/GlobalScoutDbContext.cs).

---

## Phase 3 — Messaging

**Goal:** DMs / conversations.

**Endpoints:** `backend/src/routes/messages.js` — send, conversations, thread with paging, mark read.

**Data:** `Message` entity exists.

---

## Phase 4 — Media

**Goal:** Video upload/list/delete.

**Endpoints:** `backend/src/routes/media.js`.

**Data:** `MediaItem` / `MediaType`; reuse file-storage patterns from Phase 1 avatars where appropriate.

---

## Phase 5 — Statistics & API-Football refresh

**Goal:** Stats CRUD + refresh jobs aligned with legacy.

**Endpoints:** `backend/src/routes/stats.js` + `backend/src/services/apiFootballService.js`.

**Data:** `Profile.StatsData`, `PlayerStatistics`.

---

## Phase 6 — Admin

**Goal:** Admin user management + system stats.

**Endpoints:** `backend/src/routes/admin.js`.

**Note:** [`AdminEndpoints`](src/GlobalScout/GlobalScout.Api/Features/Admin/AdminEndpoints.cs) is still a stub — add routes + admin authorization policy.

---

## Phase 7 — Account & subscriptions

**Goal:** Account info, upgrade/downgrade.

**Endpoints:** `backend/src/routes/account.js`.

**Data:** `ApplicationUser.AccountType`, `Subscription`.

---

## Phase 8 — Payments (PayPal)

**Goal:** PayPal create/capture/order + webhook.

**Endpoints:** `backend/src/routes/payment.js`.

**Note:** Defer if product switches to Stripe only (`StripeCustomerId` on user).

---

## Phase 9 — Player auto-updates (ops)

**Goal:** Background update service + operational endpoints.

**Endpoints:** `backend/src/routes/playerUpdates.js` + `backend/src/services/autoPlayerUpdateService.js`.

**Implementation sketch:** `IHostedService` / `BackgroundService` + secured start/stop/manual routes.

---

## Phase 10 — Ops & tests

**Goal:** Health/readiness parity, retire ad-hoc `/api/test` if desired, integration tests per feature.

**Reference:** Aspire `MapDefaultEndpoints`, existing [`GlobalScout.Api.IntegrationTests`](src/GlobalScout/GlobalScout.Api.IntegrationTests).

---

## Frontend contract

[`frontend/src/services/api.js`](frontend/src/services/api.js) lists paths the SPA calls; keep response shapes compatible or document breaking changes (e.g. GUID vs cuid IDs).

---

## Suggested order

1. Phase 2 → 4 (core CRUD / social / messaging / media)  
2. Phase 6 (admin)  
3. Phase 5 (stats + external API)  
4. Phases 7–9  
5. Phase 10  

Phase 1 is complete; start **Phase 2** in a new chat when ready.
