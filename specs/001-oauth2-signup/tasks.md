---

description: "Task list template for feature implementation"
---

# Tasks: OAuth2 Social Sign-Up

**Input**: Design documents from `/specs/001-oauth2-signup/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-auth-external.md, quickstart.md (all present)

**Tests**: Included as required tasks — Constitution Principle II (Integration Testing with Real Infrastructure) is NON-NEGOTIABLE for this repo, and `plan.md`'s Constitution Check already commits to Testcontainers-backed integration tests plus a test authentication handler standing in for the live provider (see `research.md`).

**Organization**: Tasks are grouped by user story (spec.md priorities P1/P2/P3) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- File paths are relative to repo root unless noted

## Path Conventions

Existing two-project layout (see `plan.md` Project Structure):
- Backend: `src/api/GlobalScout.Api/`, `GlobalScout.Application/`, `GlobalScout.Infrastructure/`, `GlobalScout.Application.UnitTests/`, `GlobalScout.Api.IntegrationTests/` (all rooted under `src/api/`)
- Frontend: `src/ui/apps/web/`

`IEndpoint`-implementing classes under `Api/Endpoints/` are auto-discovered by the existing assembly scan (confirmed via `GetAuthProfile.cs`/`PostAuthLogin.cs`/`PostAuthRegister.cs` siblings) — no manual route-registration task is needed for new endpoints.

---

## Phase 1: Setup

**Purpose**: Prerequisite plumbing before any provider-specific or story-specific code can be written

- [X] T001 Add `Microsoft.AspNetCore.Authentication.Google`, `Microsoft.AspNetCore.Authentication.Facebook`, and `AspNet.Security.OAuth.Apple` package references (matching the existing `Microsoft.AspNetCore.Authentication.JwtBearer` 10.0.6 version family) to `src/api/GlobalScout.Infrastructure/GlobalScout.Infrastructure.csproj`
- [X] T002 [P] Add `Authentication__Google__ClientId/ClientSecret`, `Authentication__Facebook__ClientId/ClientSecret`, `Authentication__Apple__ClientId/KeyId/TeamId/PrivateKey` placeholders to local dev wiring (.NET Aspire AppHost env / user-secrets template), following the existing `Section__Key` convention used for `Jwt__*`/`Stripe__*` in `docker-compose.yml`
- [X] T003 Verify the new callback/handoff endpoint paths (`https://api.globalscout.eu/api/auth/external/{provider}/callback`, `https://globalscout.eu/api/auth/external/complete`) against `docs/AWS-infrastructure_setup_documentation.md` and `.cursor/rules/aws-production-architecture.mdc` before any nginx/CORS change — Constitution Principle V gate carried over from `plan.md`

**Checkpoint**: Packages restorable, config keys known, production URL constraints confirmed — safe to build foundational auth code.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared infrastructure every user story's endpoints depend on — the find-or-create-or-link decision logic, provider handler registration, and handoff-code mechanism are used by every subsequent story, so they land here per `plan.md`'s Project Structure.

**🚨 CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Add `External` route constants (`api/auth/external/{provider}/challenge`, `.../callback`, `api/auth/external/exchange`) to `src/api/GlobalScout.Api/Endpoints/Auth/AuthRoutes.cs`
- [X] T005 [P] Implement `ExternalAuthenticationExtensions.cs` in `src/api/GlobalScout.Infrastructure/Auth/ExternalAuthenticationExtensions.cs` — registers `AddGoogle`, `AddFacebook`, and `AddOAuth("Apple", ...)` (via `AspNet.Security.OAuth.Apple`) against the config keys from T002, wired into the existing `AddAuthentication()` builder call
- [X] T006 [P] Implement `HandoffCodeStore.cs` in `src/api/GlobalScout.Infrastructure/Auth/HandoffCodeStore.cs` — single-use, 60s-TTL opaque code storage per the handoff-code decision in `research.md`
- [X] T007 Implement `CompleteExternalLoginCommand`/`CompleteExternalLoginCommandHandler` in `src/api/GlobalScout.Application/Auth/ExternalLogin/` — the find-vs-create-vs-link decision tree from `data-model.md`'s state-transition diagram: existing `ProviderKey` → sign in; provider-verified email matching an existing account → auto-link (FR-010); unverified email collision → reject with `email_in_use`; age/DOB < 16 → reject with `under_age` (FR-011); no match → create `ApplicationUser` (role `PENDING`) + `Profile` + `AspNetUserLogins` row (FR-001–FR-006)
- [X] T008 Implement `ExchangeHandoffCodeCommand`/`ExchangeHandoffCodeCommandHandler` in `src/api/GlobalScout.Application/Auth/ExternalLogin/` — validates and invalidates a handoff code from T006, returns the same token/user/profile shape `PostAuthLogin`/`PostAuthRegister` return (per `contracts/api-auth-external.md`)
- [X] T009 [P] Add a test `AuthenticationHandler` double under `src/api/GlobalScout.Api.IntegrationTests/Auth/ExternalLogin/` that returns a fixed, scenario-controlled `ExternalLoginInfo` (email, verified flag, name, provider key) in place of the real Google/Facebook/Apple remote handshake, per `research.md`'s testing-strategy decision — registered only in the test host

**Checkpoint**: Decision logic, handoff codes, and the test IdP double all exist — user story endpoint/UI work can now begin.

---

## Phase 3: User Story 1 - Sign up with a social provider (Priority: P1) 🎯 MVP

**Goal**: A new visitor can create a GlobalScout account via Google/Facebook/Apple and land signed in, without a password prompt (FR-001–FR-006, FR-011, FR-012).

**Independent Test**: Start sign-up, choose a provider, complete a sandbox account's consent screen, confirm a new account is created and the person is signed in (Quickstart Scenario 1).

### Tests for User Story 1

> **NOTE**: Write these tests first; confirm they fail before the implementation tasks below make them pass.

- [X] T010 [P] [US1] Integration test: no existing user/login match → creates `ApplicationUser` (role `PENDING`) + `Profile` + `AspNetUserLogins` row and signs in, in `src/api/GlobalScout.Api.IntegrationTests/Auth/ExternalLogin/NewAccountCreationTests.cs`
- [X] T011 [P] [US1] Integration test: provider omits name and/or age → account creation still succeeds with those fields left unset (FR-004), same file as T010
- [X] T012 [P] [US1] Integration test: fake `ExternalLoginInfo` carries a birthdate under 16 → callback returns `error=under_age`, no `ApplicationUser`/`Profile`/`AspNetUserLogins` row persisted (FR-011), in `src/api/GlobalScout.Api.IntegrationTests/Auth/ExternalLogin/AgeGateTests.cs`
- [X] T013 [P] [US1] Integration test: simulated consent-denied/provider-error outcome → callback returns `error=access_denied`/`provider_error` form_post, no partial account persisted (FR-012), in `src/api/GlobalScout.Api.IntegrationTests/Auth/ExternalLogin/ProviderFailureTests.cs`
- [X] T014 [P] [US1] Unit tests for `CompleteExternalLoginCommandHandler` covering the create-new-user branch and the under-16 rejection branch in isolation, in `src/api/GlobalScout.Application.UnitTests/Auth/ExternalLogin/CompleteExternalLoginCommandHandlerTests.cs`

### Implementation for User Story 1

- [X] T015 [US1] Implement `GetAuthExternalChallenge` (`GET /api/auth/external/{provider}/challenge`) in `src/api/GlobalScout.Api/Endpoints/Auth/GetAuthExternalChallenge.cs` — validates `provider` against registered schemes (404 otherwise), issues a framework `ChallengeResult` with `returnUrl` carried through
- [X] T016 [US1] Implement `GetAuthExternalCallback` (`GET /api/auth/external/{provider}/callback`) in `src/api/GlobalScout.Api/Endpoints/Auth/GetAuthExternalCallback.cs` — completes the handler's code exchange, calls `CompleteExternalLoginCommand` (T007), and returns the CSP-locked self-submitting `form_post` HTML page with `code=` or `error=` per `contracts/api-auth-external.md`
- [X] T017 [US1] Implement `PostAuthExternalExchange` (`POST /api/auth/external/exchange`) in `src/api/GlobalScout.Api/Endpoints/Auth/PostAuthExternalExchange.cs` — calls `ExchangeHandoffCodeCommand` (T008), returns `200`/`400` per contract
- [X] T018 [US1] Implement `app/api/auth/external/complete/route.ts` in `src/ui/apps/web/app/api/auth/external/complete/route.ts` — accepts the form_post `code`/`error` body, calls `POST /api/auth/external/exchange` server-to-server on success, sets `AUTH_TOKEN_COOKIE` exactly as `app/api/auth/sign-in/route.ts` does, then issues `302` via existing `getPostAuthRedirect(role, token)`; on `error`, redirects to sign-in with a failure query flag
- [X] T019 [US1] Update `src/ui/apps/web/components/auth/social-auth-buttons.tsx` — turn the existing disabled Google/Apple buttons into real links to `{API_BASE}/api/auth/external/{provider}/challenge`, add the missing third Facebook button (FR-002)
- [X] T020 [US1] Add structured logging (via existing `ILogger<UserIdentityStore>`-style pattern) for challenge-started / callback-succeeded / callback-failed / account-created events in `GetAuthExternalCallback.cs` and/or `CompleteExternalLoginCommandHandler.cs` (FR-014)

**Checkpoint**: User Story 1 is fully functional and independently testable — new social sign-up works end to end (Quickstart Scenarios 1 and 2).

---

## Phase 4: User Story 2 - Complete required player-profile details after sign-up (Priority: P2)

**Goal**: An OAuth-created `PENDING` account falls into the platform's **existing** onboarding/player-identity-claim funnel exactly as password accounts already do (FR-006–FR-008) — per `research.md`'s "Existing foundations discovered", this funnel (`getPostAuthRedirect`, `resolvePlayerOnboardingRedirect`) is already built; this story's job is to confirm the new account shape (T007) feeds it correctly, not to rebuild it.

**Independent Test**: Seed (or create via US1) an account missing required player-profile fields; confirm it's routed to the completion step and blocked from the main platform until required fields are supplied (Quickstart Scenario 3).

### Tests for User Story 2

- [X] T021 [P] [US2] Integration test: an OAuth-created account (role `PENDING`, `Profile` with only provider-supplied fields set) round-trips through `GET /api/auth/profile` with the same shape a password-registered `PENDING` account has, in `src/api/GlobalScout.Api.IntegrationTests/Auth/ExternalLogin/OnboardingHandoffTests.cs`
- [ ] T022 [US2] ~~Frontend test confirming `getPostAuthRedirect`/`resolvePlayerOnboardingRedirect` require no branching~~ — **adjusted during implementation**: this repo has no frontend unit-test harness at all (no vitest/jest config, no `pnpm test` script, zero `*.test.ts(x)` files anywhere in `src/ui/apps/web/`), so "extend existing test file... otherwise add alongside them" assumed infrastructure that doesn't exist. Introducing a whole new test framework as a side effect of this feature would violate Constitution Principle IV. Left unchecked rather than silently marked done; T021's backend integration test covers the same claim from the other side (the `/api/auth/profile` response shape an OAuth account produces is identical to a password account's), and `getPostAuthRedirect`/`resolvePlayerOnboardingRedirect` themselves were not modified by this feature (confirmed via `git diff` — zero changes to `lib/auth/get-post-auth-redirect.ts` or `lib/auth/onboarding-redirect.ts`).

### Implementation for User Story 2

- [X] T023 [US2] Confirm (no new code expected — flag and fix only if a gap is found) that `Profile` fields populated in T007 from provider claims (`firstName`/`lastName`/`age`) match exactly what `resolvePlayerOnboardingRedirect` treats as "already known" so the person is never re-prompted for data the provider supplied (FR-005/FR-008)

**Checkpoint**: OAuth sign-ups and password sign-ups are indistinguishable to the onboarding funnel — User Story 2 requires no parallel completion flow.

---

## Phase 5: User Story 3 - Sign in again with the same social provider (Priority: P3)

**Goal**: A returning user is matched to their existing account by linked provider identity — no duplicates (FR-009), and FR-010's verified-email auto-link/unverified-email rejection behaves correctly (Quickstart Scenarios 4 and 5).

**Independent Test**: Complete sign-up once with a test provider account, sign out, sign in again with the same account, confirm the same account (same `id`, same profile state) is returned.

### Tests for User Story 3

- [X] T024 [P] [US3] Integration test: existing `ProviderKey` already linked to a user → signs into that same user, zero new `AspNetUsers`/`AspNetUserLogins` rows (FR-009), in `src/api/GlobalScout.Api.IntegrationTests/Auth/ExternalLogin/ReturningUserTests.cs`
- [X] T025 [P] [US3] Integration test: provider-verified email matches an existing password-registered account → auto-links a new `AspNetUserLogins` row to that account and signs in (FR-010), same file as T024
- [X] T026 [P] [US3] Integration test: provider does **not** confirm the email as verified and it matches an existing account → no auto-link, `error=email_in_use` directing to original sign-in method (FR-010), same file as T024
- [X] T027 [P] [US3] Unit tests for `CompleteExternalLoginCommandHandler` covering the existing-`ProviderKey` branch and both verified/unverified email-match branches in isolation, extending `CompleteExternalLoginCommandHandlerTests.cs` (T014)

### Implementation for User Story 3

- [X] T028 [US3] Confirm (no new code expected beyond T007's decision handler — fix only if a gap surfaces) that the existing-`ProviderKey` and email-match branches in `CompleteExternalLoginCommandHandler` are reachable from `GetAuthExternalCallback` for a *second* sign-in attempt, not just first-time creation — i.e. the returning-user path in T016 isn't accidentally short-circuited to always create

**Checkpoint**: All three user stories are independently functional — sign-up, onboarding handoff, and repeat sign-in/auto-link all verified.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification spanning all stories

- [X] T029 [P] Run `dotnet test` (full suite, `src/api/`) and confirm no regressions outside the new `ExternalLogin` tests — **partially verified in this environment**: all 7 backend projects build cleanly and the full `GlobalScout.Application.UnitTests` suite passes (122/122, incl. the 8 new `CompleteExternalLoginCommandHandler` tests). `GlobalScout.Api.IntegrationTests` (Testcontainers-backed) could not actually run here — no Docker daemon available in this sandbox — but all 13 new `ExternalLogin` integration tests were confirmed to compile and fail with nothing but `DockerUnavailableException`, i.e. they never reach an assertion. Re-run `dotnet test GlobalScout.Api.IntegrationTests` in an environment with Docker before trusting this task fully done. (Also fixed one unrelated pre-existing compile error blocking the whole IntegrationTests project — a missing `using System.Net.Http.Json;` in `ReferenceData/AdminReferenceDataIntegrationTests.cs` — since nothing in that project could build or run without it.)
- [X] T030 [P] Run `pnpm typecheck && pnpm lint` from `src/ui/apps/web/` after the `social-auth-buttons.tsx` and `app/api/auth/external/complete/route.ts` changes — clean on every file this feature touched; the two pre-existing failures left in the tree (`features/statistics/statistics-content.tsx` typecheck, plus a few pre-existing `react-hooks/set-state-in-effect` lint errors in unrelated reference-data components) predate this feature and were left alone per Constitution IV.
- [ ] T031 Manually execute `quickstart.md` Scenarios 1–6 end to end against the local Aspire AppHost stack with sandbox Google (minimum) credentials — **not done**: this requires real Google/Facebook/Apple OAuth app credentials and a running local stack, neither of which exists in this environment. Genuinely a human follow-up step, not something to fake or skip silently.
- [X] T032 Re-confirm the Constitution Principle V gate (T003) against the actual implemented routes once nginx/CORS/Docker Compose config is touched, before any deploy

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories (T007's decision handler is the shared core every story's tests exercise)
- **User Story 1 (Phase 3)**: Depends on Foundational only — delivers the MVP
- **User Story 2 (Phase 4)**: Depends on Foundational; independently testable once a `PENDING` account exists (can be seeded directly, doesn't strictly require Phase 3's endpoints to be live, but is most naturally validated after US1)
- **User Story 3 (Phase 5)**: Depends on Foundational; exercises the same `CompleteExternalLoginCommandHandler` (T007) from different starting states than US1, so is independently testable via the test IdP double even before US1's frontend wiring (T018–T019) exists
- **Polish (Phase 6)**: Depends on all desired stories being complete

### Within Each User Story

- Tests written and failing before implementation tasks
- Foundational decision/command layer (T007/T008) before endpoint tasks (T015–T017) before BFF/UI tasks (T018–T019)
- Story complete before moving to next priority (if working sequentially)

### Parallel Opportunities

- T001–T003 (Setup) are largely independent; T002/T003 marked [P]
- T005, T006, T009 (Foundational, different files) can run in parallel once T004 lands
- All [P]-marked tests within a story phase (different files) can run in parallel
- User Story 2 and User Story 3 can be worked in parallel by different people once Foundational is done, since neither depends on the other

---

## Parallel Example: User Story 1

```bash
# Launch all US1 tests together:
Task: "Integration test: new account creation in NewAccountCreationTests.cs"
Task: "Integration test: provider omits name/age in NewAccountCreationTests.cs"
Task: "Integration test: under-16 age gate in AgeGateTests.cs"
Task: "Integration test: consent denied/provider error in ProviderFailureTests.cs"
Task: "Unit tests for CompleteExternalLoginCommandHandler create/reject branches"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (blocks everything)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: run Quickstart Scenarios 1–2 independently
5. Demo/deploy if ready (deploy remains a manual `workflow_dispatch`, per `CLAUDE.md`)

### Incremental Delivery

1. Setup + Foundational → decision logic and test IdP double exist
2. Add User Story 1 → validate → MVP (new social sign-up works)
3. Add User Story 2 → validate (existing onboarding funnel confirmed compatible, no new flow built)
4. Add User Story 3 → validate (returning users and FR-010 linking confirmed)
5. Polish

## Notes

- [P] tasks touch different files with no unmet dependencies
- Constitution Principle II is satisfied throughout: every integration test uses real Testcontainers Postgres; only the third-party network hop is replaced by the T009 test handler
- Age/DOB is rarely available from any provider in practice (see `research.md`) — T012's age-gate test is the callback-time path; the more common self-reported path is already covered by the existing profile-completion flow (Phase 4) and is out of this feature's net-new scope
- Avoid: building a second onboarding/profile-completion mechanism for User Story 2 — the explicit finding in `research.md` is that it already exists

---

## Phase 7: Convergence

**Purpose**: Gaps found by `/speckit-converge` between the shipped implementation and what `spec.md`/`plan.md`/`contracts/api-auth-external.md` say, surfaced after `/speckit-implement` and subsequent live debugging/testing had already landed real deviations from the original design docs.

- [X] T033 Update `research.md` and `contracts/api-auth-external.md` to remove the "CSP-locked" description of the OAuth callback's form_post page and state that no `Content-Security-Policy` header is set — it was tried and dropped during implementation after a real Chrome `form-action` inconsistency blocked legitimate submissions even with a spec-compliant policy; the page is safe without it (fully server-generated, HTML-encoded content, no attacker-controlled input; the real security properties are the POST-body mechanism plus the code's single-use 60s TTL). per `research.md`, `contracts/api-auth-external.md` (contradicts)
- [X] T034 Update `contracts/api-auth-external.md` to state that `returnUrl` on `GET /api/auth/external/{provider}/challenge` is accepted and carried into the internal redirect at challenge time, but is not currently threaded through the handoff code to the completion step — `app/api/auth/external/complete/route.ts` always uses the default `getPostAuthRedirect` landing regardless. per `contracts/api-auth-external.md` (partial)
- [ ] T035 Manually execute the remaining `quickstart.md` scenarios (2: consent denied, 3: profile-completion resume, 4: returning-user re-login, 6: age gate) against live provider consent screens — only Scenarios 1 (new account) and 5 (verified-email auto-link) have been manually verified so far, with real Google and Facebook accounts. Configure and test Apple sign-in end-to-end once Apple Developer credentials exist — it has not been set up or tested at all yet. per T031, `quickstart.md` (partial)
