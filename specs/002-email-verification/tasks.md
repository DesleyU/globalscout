# Tasks: Email Verification for Password Accounts

**Input**: Design documents from `/specs/002-email-verification/`
**Prerequisites**: [plan.md](plan.md) (required), [spec.md](spec.md) (required), [research.md](research.md), [data-model.md](data-model.md), [contracts/auth-email-verification.md](contracts/auth-email-verification.md), [quickstart.md](quickstart.md)

**Tests**: Included. This feature touches authentication/account security, and the plan already designates specific unit/integration test locations mirroring the existing `Auth/Register` coverage (Constitution Principle II/III) — tests are part of the deliverable, not reflexive extras.

**Organization**: Tasks are grouped by user story (from spec.md) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- All paths are relative to the repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add the new email-sending dependency and its configuration surface.

- [X] T001 [P] Add the `AWSSDK.SimpleEmail` NuGet package reference to `src/api/GlobalScout.Infrastructure/GlobalScout.Infrastructure.csproj`
- [X] T002 [P] Add an `Email` configuration section (`Provider`, `Region`, `FromAddress`, `EndpointUrl`, `AccessKey`, `SecretKey`) to `src/api/GlobalScout.Api/appsettings.json`, mirroring the shape of the existing `ObjectStorage` section (research.md §1)
- [X] T003 [P] Add local `Email` defaults (empty/placeholder credentials, `EndpointUrl` left for the Aspire/Compose environment to inject) to `src/api/GlobalScout.Api/appsettings.Development.json`, mirroring how `ObjectStorage` is defaulted there

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared infrastructure required by every user story below.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T004 [P] Define the `IEmailSender` abstraction in `src/api/GlobalScout.Application/Abstractions/Email/IEmailSender.cs` (e.g. `Task SendAsync(string to, string subject, string htmlBody, CancellationToken cancellationToken)`)
- [X] T005 Implement `SesEmailSender : IEmailSender` in `src/api/GlobalScout.Infrastructure/Auth/Email/SesEmailSender.cs` using `AWSSDK.SimpleEmail`, reading the `Email` config section including the `EndpointUrl` override needed to target Ministack locally (depends on T004)
- [X] T006 Register `IAmazonSimpleEmailService` and `SesEmailSender`/`IEmailSender` in DI in `src/api/GlobalScout.Infrastructure/DependencyInjection.cs`, alongside the existing S3/`ObjectStorage` client registration (depends on T005)
- [X] T007 [P] Add a `LastVerificationEmailSentAt` (`DateTimeOffset?`) property to `src/api/GlobalScout.Infrastructure/Identity/ApplicationUser.cs` (data-model.md)
- [X] T008 Generate the EF Core migration adding `LastVerificationEmailSentAt` to `AspNetUsers` against `GlobalScoutDbContext` (output lands in `src/api/GlobalScout.Infrastructure/Data/Migrations/`) (depends on T007)
- [X] T009 [P] Add `VerifyEmail` and `ResendVerification` route constants to `src/api/GlobalScout.Api/Endpoints/Auth/AuthRoutes.cs` (e.g. `api/auth/verify-email`, `api/auth/resend-verification`)
- [X] T010 [P] Wire Ministack's SES endpoint into the API service in `src/api/GlobalScout.AppHost/AppHost.cs` (`Email__EndpointUrl`, `Email__Provider`, etc. pointed at `ministack.GetEndpoint("http")`, same pattern as the existing `ObjectStorage__EndpointUrl` wiring — research.md §1)
- [X] T011 [P] Wire Ministack's SES endpoint into `src/api/GlobalScout.Api.IntegrationTests/IntegrationTestFixture.cs` (`Email:EndpointUrl` etc. alongside the existing `ObjectStorage:EndpointUrl` test settings)
- [X] T012 [P] ~~Add `Email` env vars for the `api` service in `docker-compose.yml`~~ — investigated and skipped: `docker-compose.yml` has no `ObjectStorage__*` vars either; production S3 relies on blank `AccessKey`/`SecretKey` defaults plus the EC2 instance's IAM role via the AWS SDK's default credential chain. `EmailDependencyInjection.cs` mirrors that same fallback, so no docker-compose change is needed to match convention

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 3: User Story 1 - Verify email address after creating a password account (Priority: P1) 🎯 MVP

**Goal**: A new internal (email + password) account starts unverified, receives an email with a unique verification link, and clicking that link marks the email verified.

**Independent Test**: Register a new account, confirm it starts unverified, retrieve the verification link captured by Ministack's SES emulation, click it, confirm the account is now verified (quickstart.md Scenario 1).

### Tests for User Story 1

- [X] T013 [P] [US1] ~~Unit test: registering creates unverified account + sends email~~ — skipped after reviewing the actual code path: `RegisterUserCommandHandler` (Application layer) is an unchanged thin pass-through to `IUserIdentityStore.RegisterAsync`; the real EmailConfirmed/token/email logic lives in `UserIdentityStore` (Infrastructure), which depends on `UserManager<ApplicationUser>` and isn't meaningfully unit-testable in isolation. Coverage for this behavior lives in T015's integration test instead (real Postgres + Ministack, per Constitution Principle II) — a better fit than a mocked unit test here.
- [X] T014 [P] [US1] Unit tests for `VerifyEmailCommandHandler`: valid token verifies the account; an already-verified account short-circuits without re-confirming (research.md §3) — `src/api/GlobalScout.Application.UnitTests/Auth/VerifyEmail/VerifyEmailCommandHandlerTests.cs`. 5/5 pass.
- [X] T015 [P] [US1] Integration test: register → account row is unverified → `POST /api/auth/verify-email` with the real generated token verifies it — new file `src/api/GlobalScout.Api.IntegrationTests/Auth/EmailVerificationIntegrationTests.cs`. Ran against real Postgres + Ministack via Testcontainers: 3/3 pass. Caught a real bug (`VerificationEmailContent` was never registered in DI) — fixed in `EmailDependencyInjection.cs`.

### Implementation for User Story 1

- [X] T016 [P] [US1] Build the verification email content (subject + HTML body linking to `{Authentication:FrontendBaseUrl}/verify-email?token=...`, base64url-encoded per research.md §5) as a small reusable helper — `src/api/GlobalScout.Infrastructure/Auth/Email/VerificationEmailContent.cs`. Implementation note: the encoded token also embeds the user id (`userId:rawToken`, base64url) since `ConfirmEmailAsync` needs the `ApplicationUser` already resolved and the public contract exposes only one opaque token string — discovered and resolved during implementation.
- [X] T017 [US1] Modify `RegisterAsync` in `src/api/GlobalScout.Infrastructure/Identity/UserIdentityStore.cs` to create internal accounts with `emailConfirmed: false` (resolving the existing `TODO(email-verification)` comment), generate a token via `UserManager.GenerateEmailConfirmationTokenAsync`, set `LastVerificationEmailSentAt`, and send the email via `IEmailSender` using T016's content (depends on T016, T005/T006, T007/T008). Also added `VerifyEmailAsync`/`ResendVerificationEmailAsync` to `IUserIdentityStore`/`UserIdentityStore` here (natural home alongside `RegisterAsync`, reused by T018 and T025).
- [X] T018 [P] [US1] Create `VerifyEmailCommand`, `VerifyEmailCommandHandler`, `VerifyEmailCommandValidator` in `src/api/GlobalScout.Application/Auth/VerifyEmail/`, implementing the already-verified short-circuit (research.md §3) and the generic invalid/expired failure (contracts/auth-email-verification.md)
- [X] T019 [US1] Create `PostAuthVerifyEmail.cs` in `src/api/GlobalScout.Api/Endpoints/Auth/`, mapped to `AuthRoutes.VerifyEmail`, anonymous, per contracts/auth-email-verification.md (depends on T018). Response also includes `alreadyVerified: boolean` alongside `message` so the frontend doesn't need to string-match.
- [X] T020 [P] [US1] Expose `EmailConfirmed` on the profile response (FR-013) — add the field to `src/api/GlobalScout.Application/Auth/GetProfile/GetAuthProfileResult.cs`, populate it in `GetAuthProfileQueryHandler.cs`, and include it in the JSON shape returned by `src/api/GlobalScout.Api/Endpoints/Auth/GetAuthProfile.cs`
- [X] T021 [P] [US1] Create `app/(auth)/verify-email/page.tsx` in `src/ui/apps/web/` — reads `token` from the query string, calls the BFF proxy, and renders success/failure state
- [X] T022 [US1] Create `app/api/auth/verify-email/route.ts` in `src/ui/apps/web/` — BFF proxy forwarding to `POST /api/auth/verify-email` (depends on T019, T021)

**Checkpoint**: User Story 1 is fully functional and independently testable — this is the MVP.

---

## Phase 4: User Story 2 - Request a new verification link (Priority: P2)

**Goal**: A person with an unverified account can request a fresh verification email; the new link works and the old one no longer does.

**Independent Test**: Register, request a resend, confirm the old token now fails and the new one verifies the account, and confirm resend is rejected once already verified (quickstart.md Scenario 2).

### Tests for User Story 2

- [X] T023 [P] [US2] Unit tests for `ResendVerificationEmailCommandHandler` (thin pass-through — success and error propagation) — `src/api/GlobalScout.Application.UnitTests/Auth/ResendVerificationEmail/ResendVerificationEmailCommandHandlerTests.cs`. 3/3 pass. The real cooldown/stamp-rotation logic lives in `UserIdentityStore` (Infrastructure, depends on `UserManager`) and is covered by T024's integration test instead — same adjustment as T013.
- [X] T024 [P] [US2] Integration tests: resend invalidates the prior token and the new one verifies; resend on an already-verified account returns 409; resend within the cooldown window returns 429; unauthenticated resend returns 401 — extended `src/api/GlobalScout.Api.IntegrationTests/Auth/EmailVerificationIntegrationTests.cs`. 7/7 pass (full file). **Caught a real design bug**: `LastVerificationEmailSentAt` was originally set on registration's automatic send too, which spuriously throttled a person's very first resend attempt if it happened within the cooldown window of signing up. Fixed: the timestamp is now only set on an explicit resend (see `UserIdentityStore.cs`, data-model.md).

### Implementation for User Story 2

- [X] T025 [US2] Create `ResendVerificationEmailCommand`, `ResendVerificationEmailCommandHandler`, `ResendVerificationEmailCommandValidator` in `src/api/GlobalScout.Application/Auth/ResendVerificationEmail/` — cooldown check against `LastVerificationEmailSentAt`, `UpdateSecurityStampAsync`, `GenerateEmailConfirmationTokenAsync`, send via `IEmailSender` reusing T016's content helper (depends on T016, T005/T006, T007/T008). No separate validator file (no user input to validate — `UserId` comes from the authenticated principal, not the request body), matching the `ExternalLogin` precedent noted in research.
- [X] T026 [US2] Create `PostAuthResendVerification.cs` in `src/api/GlobalScout.Api/Endpoints/Auth/`, mapped to `AuthRoutes.ResendVerification`, authenticated, per contracts/auth-email-verification.md (depends on T025)
- [X] T027 [P] [US2] Create `app/api/auth/resend-verification/route.ts` in `src/ui/apps/web/` — BFF proxy forwarding to `POST /api/auth/resend-verification`
- [X] T028 [US2] Add a "Resend verification email" action to `app/(auth)/verify-email/page.tsx`, shown on the invalid/expired-link state, calling T027's proxy (depends on T021, T027) — implemented directly in `features/auth/verify-email-panel.tsx` as one cohesive component built together with T021

**Checkpoint**: User Stories 1 AND 2 both work independently.

---

## Phase 5: User Story 3 - Expired or invalid verification links are rejected (Priority: P3)

**Goal**: Expired, reused, or unrecognized tokens never verify an account and always return the same generic message, never revealing whether an account exists.

**Independent Test**: Attempt verification with an expired token and with a made-up token; both return an identical generic failure and the account remains unverified (quickstart.md Scenario 3).

### Tests for User Story 3

- [X] T029 [P] [US3] Integration tests: an expired token (via a shortened `TokenLifespan` for the test host, using a derived `WithWebHostBuilder` factory layered on the shared fixture) and a syntactically-invalid/unknown token both return the identical generic 400 body — extended `src/api/GlobalScout.Api.IntegrationTests/Auth/EmailVerificationIntegrationTests.cs`. 9/9 pass (full file). Also added the explicit `DataProtectionTokenProviderOptions.TokenLifespan = 24h` config in `DependencyInjection.cs` (planned in research.md, not yet added) — this doubles as the override point the expired-token test uses.
- [X] T030 [P] [US3] ~~Unit test: VerifyEmailCommandHandler maps every ConfirmEmailAsync failure mode~~ — covered by T014's `Handle_propagates_the_same_generic_error_for_every_invalid_token_shape` theory test at the handler layer; the real "every `ConfirmEmailAsync` failure mode" mapping happens inside `UserIdentityStore.VerifyEmailAsync` (real `UserManager`) and is exercised by T029's integration tests instead — same layering adjustment as T013/T023.

### Implementation for User Story 3

- [X] T031 [US3] Reviewed `VerifyEmailCommandHandler`/`UserIdentityStore.VerifyEmailAsync` — already returns one shared `AuthErrors.InvalidOrExpiredVerificationToken` for every failure branch (decode failure, user not found, `ConfirmEmailAsync` failure). No change needed; confirmed by T029's passing tests (expired and unrecognized tokens produce byte-identical response bodies).

**Checkpoint**: All three user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Regression guards and validation across the whole feature.

- [X] T032 [P] ~~Extend RegisterIntegrationTests.cs to assert EmailConfirmed=false~~ — already covered by `EmailVerificationIntegrationTests.Register_creates_an_unverified_account` (T015); skipped duplicating the same assertion in a second file per Constitution Principle III (pragmatic test coverage, not reflexive).
- [X] T033 [P] Extend the existing `ExternalLogin` integration tests under `src/api/GlobalScout.Api.IntegrationTests/Auth/ExternalLogin/` to confirm OAuth2 account verification behavior is unchanged by this feature (FR-011 / quickstart Scenario 4) — added `Callback_with_provider_verified_email_creates_a_verified_account` and `Callback_with_provider_unverified_email_creates_an_unverified_account` to `NewAccountCreationTests.cs`, plus an `IsEmailConfirmedAsync` helper. 5/5 pass.
- [X] T034 [P] ~~Confirm SetEmailAsync's existing email-change path rotates SecurityStamp~~ — investigated: there is no email-change feature anywhere in this codebase yet (confirmed via search: no `SetEmailAsync`/`ChangeEmail` call exists). FR-012 is therefore currently vacuously satisfied — an account's email cannot be changed at all today, so there is no path where a stale verification token could survive an email change. Noted here rather than silently dropped; revisit FR-012 when an email-change feature is eventually built (it should rotate the security stamp, e.g. via `UserManager.SetEmailAsync`, which already does this by default).
- [X] T035 Run `specs/002-email-verification/quickstart.md` end-to-end — the 3 backend integration-test scenarios (matching quickstart Scenarios 1-3) already ran against real Postgres + Ministack via Testcontainers (14 tests total, all passing) and Scenario 4 (OAuth2 unaffected) via `NewAccountCreationTests.cs`; `pnpm build` was also run for the frontend and compiled successfully (Turbopack) — the only failure was the pre-existing, unrelated `statistics-content.tsx` type error blocking the full production build, not touched by this feature. A live click-through of the Aspire AppHost stack (`dotnet run --project src/api/GlobalScout.AppHost`) was not performed in this session — the automated coverage above exercises the same backend code paths the Aspire stack would hit; a manual pass through the actual browser UI is worth doing before shipping.
- [X] T036 [P] Add an `Email`/SES-via-Ministack row to the integrations table in `docs/AGENT-ONBOARDING.md`, mirroring the existing S3/Ministack row

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion (T002/T003 config keys exist) — BLOCKS all user stories.
- **User Stories (Phase 3-5)**: All depend on Foundational completion.
  - US1 has no dependency on US2 or US3.
  - US2 reuses US1's T016 (email content helper) and T021 (verify-email page) — depends on US1.
  - US3 hardens US1's `VerifyEmailCommandHandler` (T018) — depends on US1.
- **Polish (Phase 6)**: Depends on all three user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational. No dependency on US2/US3.
- **User Story 2 (P2)**: Can start after Foundational + US1 (reuses T016, T021). Independently testable once its own tasks land.
- **User Story 3 (P3)**: Can start after Foundational + US1 (adjusts T018's handler). Independently testable once its own tasks land.

### Parallel Opportunities

- All Setup tasks (T001-T003) can run in parallel.
- Within Foundational: T004, T007, T009, T010, T011, T012 can run in parallel; T005 depends on T004, T006 depends on T005, T008 depends on T007.
- Within US1: the three test tasks (T013-T015) can run in parallel; T016, T018, T020, T021 can run in parallel with each other; T017 depends on T016, T019 depends on T018, T022 depends on T019 and T021.
- Within US2: T023-T024 in parallel; T027 in parallel with T025/T026; T028 depends on T021 (US1) and T027.
- Within US3: T029-T030 in parallel; T031 follows.
- Within Polish: T032, T033, T034, T036 can run in parallel; T035 runs last (validates everything above).

---

## Parallel Example: User Story 1

```bash
# Tests (after Foundational is done):
Task: "Unit test: register creates unverified account + sends email in RegisterUserCommandHandlerTests.cs"
Task: "Unit tests for VerifyEmailCommandHandler in VerifyEmailCommandHandlerTests.cs"
Task: "Integration test: register -> verify-email in EmailVerificationIntegrationTests.cs"

# Implementation:
Task: "Build verification email content helper in VerificationEmailContent.cs"
Task: "Create VerifyEmailCommand/Handler/Validator in Application/Auth/VerifyEmail/"
Task: "Expose EmailConfirmed on GetAuthProfileResult"
Task: "Create verify-email page.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Run quickstart.md Scenario 1 against the local Aspire stack
5. This alone resolves the `TODO(email-verification)` gap the codebase already flags — a shippable increment on its own

### Incremental Delivery

1. Setup + Foundational → foundation ready (no new container needed — Ministack already emulates SES)
2. Add User Story 1 → validate Scenario 1 → MVP ships (internal accounts stop being silently auto-verified)
3. Add User Story 2 → validate Scenario 2 → resend capability ships
4. Add User Story 3 → validate Scenario 3 → hardened against expired/invalid/reused links
5. Polish → validate Scenario 4 (OAuth2 unaffected) and run the full quickstart

---

## Notes

- [P] tasks = different files, no unmet dependencies within this list.
- [Story] label maps each task to its user story for traceability.
- US2 and US3 are not fully independent of US1 by design — the spec itself frames US2 as depending on US1 ("Depends on User Story 1: an account must exist first") and US3 as "a safety/correctness boundary around the core flow" rather than a standalone capability. Both remain independently *testable* once their own tasks are done, per their Independent Test criteria above.
- Commit after each task or logical group.
- Verify tests fail before implementing, where a test task precedes its implementation task.
