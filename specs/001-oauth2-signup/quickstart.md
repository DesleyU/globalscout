# Quickstart: Validating OAuth2 Social Sign-Up

## Prerequisites

- Local dev stack running via .NET Aspire AppHost (`dotnet run --project src/api/GlobalScout.AppHost`) — brings up Postgres, local S3, API, and Next.js together with correct env wiring, per `CLAUDE.md`.
- Test-mode OAuth2 credentials for at least one provider (Google is easiest to sandbox: a test OAuth client in Google Cloud Console with `http://localhost:<api-port>/api/auth/external/google/callback` as an allowed redirect URI). Configure via `Authentication__Google__ClientId` / `Authentication__Google__ClientSecret` (see [research.md](research.md) configuration convention) through user-secrets or the AppHost's local env.
- A test/sandbox account with the chosen provider that is not already linked to a GlobalScout account.

## Scenario 1 — New account via social sign-up (User Story 1, FR-001–FR-006)

1. Open the frontend create-account page and select "Continue with Google" (or Facebook/Apple once configured).
2. Approve the provider's consent screen with the sandbox account.
3. **Expected**: redirected back into GlobalScout, signed in, no password prompt. Inspect `GET /api/auth/profile` (or the `AUTH_TOKEN_COOKIE`-decoded JWT) — role is `PENDING`, `profile.firstName`/`lastName` populated from the provider.
4. Repeat using a sandbox account whose provider profile has no name set (if the provider allows it) — confirm account creation still succeeds (FR-004) and the person is not asked to re-enter fields the provider omitted, only routed to the existing profile-completion step for whatever is genuinely missing.

## Scenario 2 — Consent denied (FR-012, edge case)

1. Start sign-up with a provider, but click "Cancel"/"Deny" on the provider's consent screen instead of approving.
2. **Expected**: redirected back to GlobalScout with a clear failure message and a retry option; no new row appears in `AspNetUsers` for that attempt (verify via a DB check in a dev environment).

## Scenario 3 — Profile completion after sign-up (User Story 2, FR-006/FR-007/FR-008)

1. Complete Scenario 1 for a brand-new account.
2. **Expected**: landed on `/onboarding/account-type` (the existing onboarding funnel — see [research.md](research.md)), not the main dashboard.
3. Close the browser tab before finishing onboarding; sign back in with the same provider.
4. **Expected**: routed back into the same incomplete onboarding step (FR-008 — no data loss, no re-prompt for already-known fields), not treated as a fresh sign-up.

## Scenario 4 — Returning user, no duplicate account (User Story 3, FR-009)

1. Complete Scenario 1 and note the account's `id` (from `/api/auth/profile`).
2. Sign out.
3. Sign in again choosing the same provider and same sandbox account.
4. **Expected**: same `id` as step 1 — confirm no second row was created in `AspNetUsers` for that provider identity.

## Scenario 5 — Account linking on verified-email match (FR-010)

1. Create a GlobalScout account via the existing email/password registration using an email address you also control on a provider (e.g. the same Gmail address).
2. Sign out, then choose "Continue with Google" using that same Google account.
3. **Expected**: signed into the *same* account created in step 1 (same `id`), not a new one; `AspNetUserLogins` now has a `Google` row for that `UserId` alongside the password credential.

## Scenario 6 — Minimum age gate (FR-011)

1. Using a provider/test account configured with a birthdate under 16 (or, if the provider doesn't expose birthdate, complete sign-up and then attempt to self-report an under-16 birthdate at the existing profile-completion step).
2. **Expected**: account creation (or profile completion) is blocked with a clear explanation; no player profile is marked complete for an under-16 date of birth.

## Automated coverage

- `dotnet test --filter "FullyQualifiedName~ExternalLogin"` (once tests exist under `GlobalScout.Application.UnitTests`/`GlobalScout.Api.IntegrationTests`) should cover the find-vs-create-vs-link decision tree in [data-model.md](data-model.md) end-to-end against a real Testcontainers Postgres, using the test authentication handler described in [research.md](research.md) in place of a live provider network call.
- `pnpm typecheck && pnpm lint` (from `src/ui/apps/web/`) after wiring `social-auth-buttons.tsx` and the new `app/api/auth/external/complete/route.ts`.
