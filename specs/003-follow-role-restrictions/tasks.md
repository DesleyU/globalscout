---
description: "Task list for Follow Role Restrictions"
---

# Tasks: Follow Role Restrictions

**Input**: Design documents from `specs/003-follow-role-restrictions/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/follow-endpoint.md](contracts/follow-endpoint.md), [quickstart.md](quickstart.md)

**Tests**: Included — the spec's Success Criteria (SC-001, SC-002) are only verifiable with tests, and the Constitution's Integration Testing principle requires real-Postgres coverage for this kind of change.

**Organization**: Tasks are grouped by user story (spec.md) to enable independent verification of each story's guarantee. Note: because all four stories are enforced by a single shared rule table and a single handler guard clause, the *code* for the rule lands once (Foundational + User Story 1); User Stories 2-3 primarily add the tests that prove their specific slice of the same rule table, per data-model.md's exhaustive pairing table.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US4)

## Path Conventions

Existing ASP.NET Core Clean Architecture backend — paths are under `src/api/`, no frontend changes (see plan.md Frontend note). All paths below are relative to the repository root.

---

## Phase 1: Setup

- [X] T001 Confirm a clean baseline: run `dotnet build` from `src/api/` and `dotnet test GlobalScout.Api.IntegrationTests --filter "FullyQualifiedName~SocialFollowIntegrationTests"` to confirm existing Follow tests pass before any change

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Role-lookup plumbing, error vocabulary, and the pure rule table — required by every user story below.

**⚠️ CRITICAL**: No user story task can begin until this phase is complete.

- [X] T002 Add `Task<UserRole?> GetUserRoleAsync(Guid userId, CancellationToken cancellationToken)` to `ISocialGraphRepository` in `src/api/GlobalScout.Application/Abstractions/Persistence/ISocialGraphRepository.cs`
- [X] T003 [P] Implement `GetUserRoleAsync` in `src/api/GlobalScout.Infrastructure/Social/Graph/SocialGraphRepository.cs`, reusing the existing private `GetRoleNameAsync` helper and mapping its result through `AppRoleNames.ToUserRole(string)`; return `null` if the user doesn't exist
- [X] T004 [P] Add `FollowRestrictedToPlayers`, `AgentsCanOnlyFollowPlayers`, and `AdminNotInFollowGraph` error entries (`Error.Problem("Social.<Code>", "<message>")`, matching the existing style) to `src/api/GlobalScout.Application/Social/SocialErrors.cs` (a 4th entry, `FollowNotEligible`, was also added during implementation as a fallback for Club/Pending-as-follower — see tasks.md Implementation Notes)
- [X] T005 Create `src/api/GlobalScout.Application/Social/Follow/FollowEligibility.cs`: a pure static class exposing `Result Evaluate(UserRole followerRole, UserRole targetRole)`, implementing the full pairing table from `data-model.md` (Player→Player and ScoutAgent→Player succeed; all 23 other pairings fail with the matching error from T004) — depends on T004
- [X] T006 [P] Add `RegisterScoutAgentUserAsync` and `RegisterAdminUserAsync` helpers to `src/api/GlobalScout.Api.IntegrationTests/Social/SocialIntegrationTestHelpers.cs`, mirroring the existing `RegisterPlayerUserAsync`/`RegisterClubUserAsync` pattern (register + `AssignRoleAsync` with `AppRoleNames.ScoutAgent` / `AppRoleNames.Admin` + login) — needed by User Story 2 and 3 integration tests

**Checkpoint**: Role lookup, error vocabulary, and rule table exist and compile; nothing is wired into the live follow path yet.

---

## Phase 3: User Story 1 - Player follows another Player (Priority: P1) 🎯 MVP

**Goal**: Wire the eligibility gate into the live follow path and prove the existing Player→Player flow is unaffected.

**Independent Test**: A Player follows another Player via `POST /api/follow/{userId}/follow` and it still succeeds exactly as before.

- [X] T007 [US1] In `FollowUserCommandHandler.Handle` (`src/api/GlobalScout.Application/Social/Follow/FollowUserCommandHandler.cs`), resolve both users' roles via `GetUserRoleAsync` and call `FollowEligibility.Evaluate`, returning the mapped error on failure — placed after the existing "not self" / "target exists" checks and before the "already following" check (see contracts/follow-endpoint.md ordering note); depends on T002-T005
- [X] T008 [P] [US1] Unit test: `FollowEligibility.Evaluate(Player, Player)` succeeds, in `src/api/GlobalScout.Application.UnitTests/Social/Follow/FollowEligibilityTests.cs`
- [X] T009 [P] [US1] Unit test: `FollowUserCommandHandler` still returns success for a Player following a Player (mocked `ISocialGraphRepository`), in `src/api/GlobalScout.Application.UnitTests/Social/Follow/FollowUserCommandHandlerTests.cs`
- [X] T010 [US1] Integration test: Player→Player follow still returns `200 OK` and creates the follow row, added to `src/api/GlobalScout.Api.IntegrationTests/Social/SocialFollowIntegrationTests.cs` — depends on T007 (existing tests in this file also switched from Club to Player accounts, since Club↔Club is no longer an allowed follow pairing — see Implementation Notes)

**Checkpoint**: Eligibility gate is live; Player→Player regression-safe end-to-end.

---

## Phase 4: User Story 2 - Agent follows a Player (Priority: P1)

**Goal**: Confirm an Agent (`ScoutAgent`) following a Player succeeds under the same gate.

**Independent Test**: A `ScoutAgent` account follows a `Player` account via `POST /api/follow/{userId}/follow` and it succeeds.

- [X] T011 [P] [US2] Unit test: `FollowEligibility.Evaluate(ScoutAgent, Player)` succeeds, in `FollowEligibilityTests.cs`
- [X] T012 [P] [US2] Unit test: `FollowUserCommandHandler` returns success for an Agent following a Player, in `FollowUserCommandHandlerTests.cs`
- [X] T013 [US2] Integration test: Agent→Player follow returns `200 OK`, using `RegisterScoutAgentUserAsync` (T006) and `RegisterPlayerUserAsync`, added to `SocialFollowIntegrationTests.cs` — depends on T006, T007

**Checkpoint**: Both allowed pairings (Player→Player, Agent→Player) verified end-to-end.

---

## Phase 5: User Story 3 - Disallowed follow attempts are clearly rejected (Priority: P1)

**Goal**: Every disallowed pairing is rejected with a specific, role-aware error — not a generic failure — and existing data/unfollow are unaffected.

**Independent Test**: Attempting Player→Agent, Player→Club, Agent→Agent, anyone→Admin, and Admin→anyone are all rejected with the expected named error code; unfollow and pre-existing rows are untouched.

- [X] T014 [P] [US3] Unit test: `FollowEligibility.Evaluate` rejects all 23 disallowed pairings from the `data-model.md` table with the correct error each, in `FollowEligibilityTests.cs` (parameterized/`[Theory]` test covering the full `UserRole × UserRole` matrix)
- [X] T015 [P] [US3] Unit test: `FollowUserCommandHandler` surfaces the exact `SocialErrors` entry returned by `FollowEligibility` for a representative disallowed pairing (e.g. Player→Agent) without reaching `CreateFollowAsync`, in `FollowUserCommandHandlerTests.cs`
- [X] T016 [US3] Integration tests: Player→Agent, Player→Club, Agent→Agent, Player→Admin, and Admin→Player each return `400 Bad Request` with the expected `code` extension, using `RegisterScoutAgentUserAsync`/`RegisterAdminUserAsync`/`RegisterClubUserAsync` (T006), added to `SocialFollowIntegrationTests.cs` — depends on T006, T007
- [X] T017 [US3] Integration test: unfollowing a currently-followed user still succeeds regardless of role pairing (FR-009), added to `SocialFollowIntegrationTests.cs` — depends on T007

**Checkpoint**: Full rule table enforced and verified at both unit and integration level; unfollow path confirmed unaffected.

---

## Phase 6: User Story 4 - Follow affordances only appear where allowed (Priority: P2) — Deferred

**No tasks.** Per research.md ("Decision: Frontend scope"), `src/ui/apps/web/lib/api/follow.ts` currently has zero call sites — there is no Follow button anywhere in the product today, so there is nothing to hide. This story is satisfied vacuously by the backend enforcement in Phases 2-5 (any future Follow UI will receive the 400 rejection from the API if it doesn't pre-filter) and becomes actionable only once a Follow UI is built, which is out of scope for this feature.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T018 Run the full backend suite — `dotnet test` in `src/api/` (both `GlobalScout.Application.UnitTests` and `GlobalScout.Api.IntegrationTests`) — to confirm no regression to Connections, Messages, or other Social tests. Result: 161/161 unit tests pass; 123/139 integration tests pass. The 16 integration failures are **pre-existing and unrelated to this feature** — see Implementation Notes below.
- [X] T019 Equivalent of the manual `quickstart.md` steps executed via the automated integration test suite (real HTTP calls through `WebApplicationFactory` against a real Postgres Testcontainer) rather than a separately spun-up AppHost + curl — steps 1-6 are directly covered by `SocialFollowIntegrationTests.cs`; step 7 (Connections unaffected) could not be verified end-to-end due to the pre-existing, unrelated Connections breakage noted below

---

## Implementation Notes (post-hoc)

- **A 4th error, `Social.FollowNotEligible`,** was added to `SocialErrors.cs` beyond the 3 named in T004/contracts/follow-endpoint.md, as a fallback for Club/Pending-as-follower cases that don't fit "Players can only follow Players" or "Agents can only follow Players" wording. `contracts/follow-endpoint.md` explicitly allowed for this ("or a Club-specific code if clearer during implementation").
- **Pre-existing tests in `SocialFollowIntegrationTests.cs` used `RegisterClubUserAsync` for both sides of every follow** (Club↔Club was previously unrestricted). Since Club↔Club is now a disallowed pairing, all such tests were switched to `RegisterPlayerUserAsync` so they continue to validate generic follow mechanics (pagination, status, stats, already-following, etc.) under an allowed pairing rather than testing role restriction incidentally. A code comment was added explaining this.
- **`SocialIntegrationTestHelpers.AssignRoleAsync` was changed from `private` to `public`** to support the new "unfollow still works after a role change" test (T017's edge case from spec.md).
- **Full-suite regression (T018) surfaced 16 pre-existing integration test failures** in `SocialConnectionsIntegrationTests`, `SocialMessagingIntegrationTests`, `ReferenceData*`, and `Stats*` — all failing with HTTP 403/`Auth.EmailNotVerified`-shaped errors, traced to already-uncommitted, in-progress email-verification work in this working tree (`SendConnectionRequestCommandHandler.cs` was already modified before this feature started — see git status at session start). None of the failing files were touched by this feature, and Follow itself has no email-verification gate (confirmed by all 19 Follow integration tests passing). This is flagged for the user, not fixed here, per Constitution Principle IV (minimal, convention-matching diffs — don't fix unrelated code as a side effect).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user stories.
- **User Story 1 (Phase 3)**: Depends on Phase 2. Delivers the actual handler wiring (T007) that Phases 4-5 build additional test coverage against.
- **User Story 2 (Phase 4)**: Depends on Phase 2 and on T007 (the handler wiring lands once, in Phase 3) — not on any other Phase 3 test task.
- **User Story 3 (Phase 5)**: Depends on Phase 2 and on T007, same as Phase 4.
- **User Story 4 (Phase 6)**: No tasks — deferred.
- **Polish (Phase 7)**: Depends on Phases 3-5 being complete.

### Parallel Opportunities

- T003, T004 can run in parallel (different files) once T002 exists.
- T006 can run in parallel with T003-T005 (different file, no shared dependency).
- T008, T009 can run in parallel once T005/T007 exist respectively; same for T011/T012 and T014/T015.
- Integration test tasks (T010, T013, T016, T017) all touch the same file (`SocialFollowIntegrationTests.cs`) — treat as sequential (not `[P]`) to avoid merge conflicts within one file, even though they belong to different stories.

---

## Implementation Strategy

### MVP First

1. Phase 1 (Setup) → Phase 2 (Foundational) → Phase 3 (User Story 1).
2. **Stop and validate**: run T008-T010; Player→Player follow is proven unaffected and the gate is live.
3. This alone already rejects every disallowed pairing too (T007 implements the full rule table from data-model.md in one pass) — Phases 4-5 exist to *prove* that, not to add more production code.

### Incremental Delivery

1. Setup + Foundational + User Story 1 → gate is live, MVP regression-proven.
2. Add User Story 2 tests → Agent→Player capability proven.
3. Add User Story 3 tests → full rejection matrix + unfollow/no-retroactive-change proven.
4. Polish → full-suite regression run + manual quickstart pass.

### Notes

- [P] tasks = different files, no dependencies.
- Commit after each phase checkpoint.
- T007 is the single highest-risk task (it's the only production-code change to the live handler); everything else is additive (new file) or test-only.
