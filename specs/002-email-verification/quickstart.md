# Quickstart: Validate Email Verification for Password Accounts

## Prerequisites

- Local stack running via the Aspire AppHost (`dotnet run --project src/api/GlobalScout.AppHost`) or Docker Compose (`docker compose up`) — either brings up Postgres, the API, and the Next.js UI together.
- The `Email` configuration section (added by this feature) pointed at either real AWS SES sandbox credentials, or a local capture sink (e.g. a fake `IEmailSender` / a tool like Mailhog) for dev — see research.md §1. For quickstart purposes, a logging/console `IEmailSender` stub that writes the verification link to logs is sufficient to validate the flow without real email delivery.
- No pre-existing account required — the scenarios below create one.

## Scenario 1 — New internal account starts unverified and receives a link (User Story 1)

1. Register a new account: `POST /api/auth/register` with a fresh email + password.
2. Confirm the response indicates success and the account is created, but query the account's
   verification status (e.g. via `GET /api/auth/profile` with the returned token) and confirm
   `emailConfirmed` (or equivalent field) is `false`.
3. Retrieve the verification link from wherever `IEmailSender` sent/logged it in this
   environment; extract the `token` query parameter.
4. Call `POST /api/auth/verify-email` with `{ "token": "<extracted token>" }`.
5. **Expected**: `200 OK`; re-checking the account's profile now shows `emailConfirmed: true`.
6. Call `POST /api/auth/verify-email` again with the *same* token.
7. **Expected**: generic `400` invalid-link response (single-use — FR-005).

## Scenario 2 — Resend issues a fresh link and invalidates the old one (User Story 2)

1. Register a new account (as above); do not click the link yet.
2. Sign in as that account and call `POST /api/auth/resend-verification`.
3. **Expected**: `200 OK`, a second verification email is sent with a *different* token.
4. Attempt `POST /api/auth/verify-email` with the **original** (pre-resend) token.
5. **Expected**: generic `400` invalid-link response (superseded — FR-007).
6. Attempt `POST /api/auth/verify-email` with the **new** token.
7. **Expected**: `200 OK`; account becomes verified.
8. While still signed in and now verified, call `POST /api/auth/resend-verification` again.
9. **Expected**: `409 Conflict`, "already verified" (FR-009).

## Scenario 3 — Expired and invalid links are rejected (User Story 3)

1. Register a new account and obtain its verification token.
2. Either wait past the 24-hour expiry window, or (in a test/integration context) seed a token
   row with `ExpiresAt` in the past directly against the database.
3. Call `POST /api/auth/verify-email` with that token.
4. **Expected**: generic `400` invalid-link response; account remains unverified.
5. Call `POST /api/auth/verify-email` with a syntactically plausible but entirely made-up token.
6. **Expected**: same generic `400` response — indistinguishable from the expired case (FR-008).

## Scenario 4 — OAuth2 accounts are unaffected

1. Complete an OAuth2 sign-up (e.g. Google) via the existing `ExternalLogin` flow.
2. Confirm the resulting account's verification status follows existing behavior (verified when
   the provider asserts a verified email; unverified only when the provider supplies no usable
   email) — unchanged by this feature (FR-011).

## Where to look for automated coverage

- Unit tests: `GlobalScout.Application.UnitTests/Auth/VerifyEmail/`,
  `GlobalScout.Application.UnitTests/Auth/ResendVerificationEmail/`.
- Integration tests (real Postgres via Testcontainers, per Constitution Principle II):
  `GlobalScout.Api.IntegrationTests/Auth/EmailVerificationIntegrationTests.cs`, extending the
  existing `RegisterIntegrationTests.cs` to assert the unverified-on-create behavior.
