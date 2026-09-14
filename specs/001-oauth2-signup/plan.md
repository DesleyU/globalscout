# Implementation Plan: OAuth2 Social Sign-Up

**Branch**: `001-oauth2-signup` (spec directory name; per this repo's trunk-based workflow, implementation happens directly on `main` — no git branch is created for this feature) | **Date**: 2026-09-09 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-oauth2-signup/spec.md`

## Summary

New visitors can create a GlobalScout account by authenticating through Google, Facebook, or Apple via OAuth2, instead of (or alongside) the existing email/password registration. GlobalScout captures whatever email, name, and age the provider is willing to share, creates the account with the same `PENDING` role existing password sign-ups already use, and lets the person fall into the platform's **existing** onboarding/player-identity-claim funnel to supply anything still required for a basic player profile. Returning users are matched by linked provider identity (no duplicates); a provider-verified email that matches an existing account auto-links rather than forking a second account; accounts are blocked at creation if the resolved age is under 16.

Technically, this is additive to the existing ASP.NET Core Identity setup: new OAuth2 remote-authentication handlers (Google/Facebook official packages, Apple via the aspnet-contrib package) feed into `UserManager`'s built-in external-login support (`AspNetUserLogins`), reusing the existing JWT issuer, cookie, and onboarding-redirect machinery end-to-end. See [research.md](research.md) for the concrete flow (API-hosted challenge/callback + short-lived handoff code exchanged by the Next.js BFF) and the provider-specific realities (age/DOB is rarely available from any provider) that shape the design.

## Technical Context

**Language/Version**: C# / .NET 10 (ASP.NET Core, matches existing `net10.0` target and `Microsoft.AspNetCore.*` 10.0.6 packages) for the backend; TypeScript / Next.js 16 App Router for the frontend BFF and UI.

**Primary Dependencies**: `Microsoft.AspNetCore.Identity.EntityFrameworkCore` + `UserManager<ApplicationUser>` (existing, reused as-is) · `Microsoft.AspNetCore.Authentication.JwtBearer` (existing, reused for session issuance) · **new**: `Microsoft.AspNetCore.Authentication.Google`, `Microsoft.AspNetCore.Authentication.Facebook`, `AspNet.Security.OAuth.Apple` · frontend: existing BFF route-handler pattern (`app/api/auth/*`), no new frontend dependency.

**Storage**: PostgreSQL via EF Core (existing `GlobalScoutDbContext`). No new tables — reuses ASP.NET Core Identity's existing `AspNetUserLogins` table for linked provider identities and the existing `Profile`/`ApplicationUser` tables. See [data-model.md](data-model.md).

**Testing**: `dotnet test` (`GlobalScout.Application.UnitTests` for the find-vs-create-vs-link decision logic, `GlobalScout.Api.IntegrationTests` with Testcontainers Postgres + a test authentication handler standing in for the live provider network hop — see [research.md](research.md)); `pnpm typecheck` / `pnpm lint` from `src/ui/apps/web/` for the frontend changes.

**Target Platform**: Existing production topology — AWS CloudFront → ALB → single EC2 host running Docker Compose (`ui`, `api`, `postgres`, `migrator`); local dev via .NET Aspire AppHost or Docker Compose, unchanged.

**Project Type**: Web application (existing ASP.NET Core API + Next.js frontend, two-project layout already in the repo — see Project Structure below).

**Performance Goals**: No new throughput targets beyond existing auth traffic; SC-001 (sign-up completable in under 60s excluding the provider's own consent screen) is a UX/flow-length target, not a load target.

**Constraints**: Must preserve Constitution Principle V's production URL/CORS invariants — new OAuth callback and handoff routes must use the canonical `https://api.globalscout.eu/api/...` and `https://globalscout.eu/...` origins, never relative paths, and must be checked against `docs/AWS-infrastructure_setup_documentation.md` before any nginx/CORS change. Must not put long-lived JWTs in redirect URLs (see research.md handoff-code decision). Must enforce the 16-minimum-age gate (FR-011) at whichever point age actually becomes known, since providers rarely supply it.

**Scale/Scope**: Additive to the existing single-feature auth surface (`Api/Endpoints/Auth`, `Application/Auth`, `Infrastructure/Auth` — already small, feature-first folders); no new services or infrastructure components.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Result |
|---|---|---|
| I. Feature-First Clean Architecture (NON-NEGOTIABLE) | New code lands in `Application/Auth/ExternalLogin/<UseCase>/`, `Api/Endpoints/Auth/` (alongside existing `PostAuthRegister`/`PostAuthLogin`), `Infrastructure/Auth/` (OAuth handler registration) — mirrors the existing `Auth` feature folder exactly, no new technical-folder pattern introduced. | **PASS** |
| II. Integration Testing with Real Infrastructure (NON-NEGOTIABLE) | Integration tests use real Testcontainers Postgres throughout; only the unreachable-from-CI third-party IdP network hop is substituted with a test authentication handler producing the same `ExternalLoginInfo` shape a real provider would (see research.md). Database/persistence is never mocked. | **PASS** (documented, not a violation — the constitution's Testcontainers mandate scopes to *this project's* infrastructure, not third-party IdPs) |
| III. Pragmatic Test Coverage | Tests added cover real new decision logic (find/create/link/reject) and the age gate — not reflexive coverage of framework plumbing. | **PASS** |
| IV. Minimal, Convention-Matching Diffs | Reuses existing `UserManager`, `IJwtTokenIssuer`, `AUTH_TOKEN_COOKIE`, `getPostAuthRedirect`, and the existing `PENDING`-role onboarding funnel wholesale instead of building parallel mechanisms; config follows the existing `Section__Key` env-var convention. | **PASS** |
| V. Production URL & CORS Invariants (NON-NEGOTIABLE) | New callback/handoff endpoints must use canonical `api.globalscout.eu`/`globalscout.eu` origins. Actual nginx/CORS/Docker Compose changes during implementation MUST be checked against `docs/AWS-infrastructure_setup_documentation.md` and `.cursor/rules/aws-production-architecture.mdc` first — flagged as a required step for `/speckit-tasks`, not yet performed. | **PASS (gate carried into tasks)** |

No violations requiring Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/001-oauth2-signup/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output
├── data-model.md         # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/            # Phase 1 output
│   └── api-auth-external.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/api/
├── GlobalScout.Api/
│   └── Endpoints/Auth/
│       ├── AuthRoutes.cs                    # extend with External* route constants
│       ├── GetAuthExternalChallenge.cs      # new: GET /api/auth/external/{provider}/challenge
│       ├── GetAuthExternalCallback.cs       # new: GET /api/auth/external/{provider}/callback
│       └── PostAuthExternalExchange.cs      # new: POST /api/auth/external/exchange
├── GlobalScout.Application/
│   └── Auth/ExternalLogin/
│       ├── CompleteExternalLoginCommand.cs  # new: find-or-create-or-link decision (FR-001–FR-011)
│       ├── CompleteExternalLoginCommandHandler.cs
│       └── ExchangeHandoffCodeCommand(Handler).cs
├── GlobalScout.Infrastructure/
│   └── Auth/
│       ├── ExternalAuthenticationExtensions.cs  # AddGoogle/AddFacebook/AddOAuth("Apple") registration
│       └── HandoffCodeStore.cs                  # single-use, short-TTL code storage
├── GlobalScout.Application.UnitTests/Auth/ExternalLogin/
└── GlobalScout.Api.IntegrationTests/Auth/ExternalLogin/    # Testcontainers + test auth handler

src/ui/apps/web/
├── components/auth/social-auth-buttons.tsx   # modify: enable Google/Apple, add Facebook
├── app/api/auth/external/complete/route.ts   # new: BFF handoff-code exchange + cookie set
└── lib/auth/                                  # reuse existing constants.ts, roles.ts, onboarding-redirect.ts as-is
```

**Structure Decision**: Existing two-project layout (`src/api` ASP.NET Core Clean Architecture, `src/ui/apps/web` Next.js BFF+UI) is unchanged. This feature adds one new feature-first slice (`ExternalLogin`) inside the existing `Auth` area on the backend, and extends the existing `auth` component/route-handler folders on the frontend — no new top-level directories.

## Complexity Tracking

*No Constitution violations requiring justification — table intentionally omitted.*
