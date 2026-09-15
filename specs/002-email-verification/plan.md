# Implementation Plan: Email Verification for Password Accounts

**Branch**: `002-email-verification` | **Date**: 2026-09-14 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-email-verification/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Internal (email + password) accounts are currently created with `EmailConfirmed = true` unconditionally, even though nothing has verified the address. This feature makes internal accounts start unverified, sends a transactional email containing a unique, single-use, 24-hour-expiring link, and marks the account verified when that link is clicked. A resend path lets people request a fresh link (invalidating the prior one), and expired/invalid/reused links are rejected without leaking account existence. OAuth2 accounts are untouched. Technical approach: reuse ASP.NET Core Identity's already-registered email confirmation token infrastructure (`UserManager.GenerateEmailConfirmationTokenAsync`/`ConfirmEmailAsync`, backed by the already-configured `DataProtectorTokenProvider`) instead of building a custom token store — no new table, just one new nullable timestamp column on `ApplicationUser` for resend throttling — plus a new `IEmailSender` abstraction backed by AWS SES (the AWS-native choice, consistent with this project's existing AWS-hosted infrastructure and S3 usage), and two new Auth endpoints (`verify-email`, `resend-verification`) following the existing `ICommand`/`ICommandHandler` + minimal-API `IEndpoint` conventions.

## Technical Context

**Language/Version**: C# / .NET 10 (net10.0) — backend; TypeScript / Next.js 16 (App Router) — frontend BFF + verification page

**Primary Dependencies**: ASP.NET Core Identity (`ApplicationUser : IdentityUser<Guid>`, `UserManager<ApplicationUser>` — already registered with `AddDefaultTokenProviders()`), EF Core + Npgsql, the project's custom `ICommand<TResult>`/`ICommandHandler<TCommand,TResult>` messaging abstraction (`GlobalScout.Application.Abstractions.Messaging`) returning `Result<T>`, AWSSDK.SimpleEmail (new) for sending mail

**Storage**: PostgreSQL, via `GlobalScoutDbContext`. No new table — one new nullable column (`LastVerificationEmailSentAt`) on the existing `AspNetUsers`/`ApplicationUser` row; verification tokens themselves are stateless (Identity's `DataProtectorTokenProvider`), not persisted (see [data-model.md](data-model.md))

**Testing**: xUnit — `GlobalScout.Application.UnitTests` (handler/validator unit tests, mirroring `Auth/Register/`), `GlobalScout.Api.IntegrationTests` with Testcontainers-backed Postgres (mirroring `Auth/RegisterIntegrationTests.cs`), per Constitution Principle II

**Target Platform**: Linux containers on a single AWS EC2 host (Docker Compose: `api`, `ui`, `postgres`, `migrator`) behind ALB + CloudFront

**Project Type**: Web application (existing `src/api` ASP.NET Core backend + `src/ui/apps/web` Next.js frontend)

**Performance Goals**: Verification email dispatched within 2 minutes of registration/resend (SC-001, SC-004); no specific throughput target beyond existing auth endpoints' baseline

**Constraints**: Token must be cryptographically unguessable (FR-003) and its 24h lifespan must survive process restarts/redeploys — satisfied by Identity's `DataProtectorTokenProvider`, which is stateless by construction (nothing to lose on restart), ruling out the in-memory `HandoffCodeStore` pattern as unnecessary here rather than insufficient; verification/resend responses must not reveal whether an account exists (FR-008)

**Scale/Scope**: 2 new backend endpoints, 1 new column on an existing entity (no new table), 1 new email-sending abstraction + AWS SES implementation, 1 new frontend confirmation page + BFF proxy route; no changes to OAuth2 flow

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Feature-First Clean Architecture** — PASS. New code follows existing `Auth` area conventions: `Application/Auth/VerifyEmail/`, `Application/Auth/ResendVerificationEmail/` (commands/handlers/validators), `Api/Endpoints/Auth/` (new `IEndpoint` files + `AuthRoutes` entries), `Infrastructure/Auth/` or `Infrastructure/Identity/` for the token store and SES-backed `IEmailSender`. No technical-folder grouping introduced.
- **II. Integration Testing with Real Infrastructure** — PASS. Integration tests for verify/resend flows will use the existing Testcontainers-backed `IntegrationTestFixture`/`IntegrationCollection`, exercising real Postgres for the `LastVerificationEmailSentAt` column and real ASP.NET Core Identity token generation/validation. `IEmailSender` is exercised against Ministack's SES emulation (already run by `IntegrationTestFixture` for S3 — see research.md §1) rather than a fake, consistent with Principle II's preference for real infrastructure over mocks and mirroring how `ObjectStorage` is already tested there.
- **III. Pragmatic Test Coverage** — PASS. Tests added mirror existing Auth test coverage (validator unit tests, handler unit tests, integration tests for the new endpoints); no reflexive over-testing.
- **IV. Minimal, Convention-Matching Diffs** — PASS. Reuses `ICommand`/`ICommandHandler`, `IEndpoint`, `Result<T>`, existing `ApplicationUser.EmailConfirmed` field (no new "verified" flag needed), and — critically — ASP.NET Core Identity's already-registered `UserManager.GenerateEmailConfirmationTokenAsync`/`ConfirmEmailAsync` token infrastructure instead of a custom persisted token table (an earlier draft of this plan proposed a new `EmailVerificationToken` entity/migration; reusing the framework's own token provider is a smaller, more convention-matching diff — see research.md §2). Only a single new nullable column is added via the existing migration workflow. `UserIdentityStore.RegisterAsync`'s existing `TODO(email-verification)` comment is resolved by this feature rather than worked around.
- **V. Production URL & CORS Invariants** — PASS. No new cross-origin surface: the verification link points at the existing frontend origin (`https://globalscout.eu/verify-email?...`), which calls the existing BFF proxy pattern (`app/api/auth/*/route.ts`) into the existing API origin. No direct browser-to-API calls introduced.

No violations requiring Complexity Tracking.

**Post-Design Re-check** (after Phase 0/1 artifacts below): during Phase 0 research, the initial
approach (a custom persisted `EmailVerificationToken` table) was replaced with ASP.NET Core
Identity's already-registered `UserManager` token infrastructure — a strictly smaller diff (one
new column vs. a new table/entity/migration set), reusing framework capability the project already
depends on rather than duplicating it. This *strengthens* the Principle IV assessment rather than
changing the verdict. The SES-backed `IEmailSender` abstraction and the two new `Auth` endpoints
are unchanged. Still PASS on all five principles.

## Project Structure

### Documentation (this feature)

```text
specs/002-email-verification/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/api/
├── GlobalScout.Domain/
│   └── Identity/                              # existing: AccountType.cs, UserStatus.cs — no change expected
├── GlobalScout.Application/
│   ├── Abstractions/
│   │   └── Email/
│   │       └── IEmailSender.cs                 # NEW: sends a templated verification email
│   └── Auth/
│       ├── Register/                           # existing — modified to issue a token (via UserManager) + send email instead of emailConfirmed:true
│       ├── VerifyEmail/                        # NEW: VerifyEmailCommand/Handler/Validator (wraps UserManager.ConfirmEmailAsync)
│       └── ResendVerificationEmail/             # NEW: ResendVerificationEmailCommand/Handler/Validator (rotates SecurityStamp, re-issues token)
├── GlobalScout.Infrastructure/
│   ├── Auth/
│   │   ├── HandoffCodeStore.cs                 # existing precedent (in-memory) — NOT reused; see research.md §2
│   │   └── Email/
│   │       └── SesEmailSender.cs               # NEW: IEmailSender implementation via AWS SES
│   ├── Identity/
│   │   ├── ApplicationUser.cs                  # existing — add LastVerificationEmailSentAt column; EmailConfirmed reused as-is
│   │   └── UserIdentityStore.cs                # existing — RegisterAsync TODO(email-verification) resolved
│   └── Data/
│       └── Migrations/                         # existing — new migration adds one column to AspNetUsers (no new table)
├── GlobalScout.Api/
│   └── Endpoints/
│       └── Auth/
│           ├── AuthRoutes.cs                   # existing — add VerifyEmail, ResendVerification route constants
│           ├── PostAuthVerifyEmail.cs           # NEW
│           └── PostAuthResendVerification.cs    # NEW
├── GlobalScout.Application.UnitTests/
│   └── Auth/
│       ├── VerifyEmail/                        # NEW: handler/validator unit tests
│       └── ResendVerificationEmail/             # NEW: handler/validator unit tests
└── GlobalScout.Api.IntegrationTests/
    └── Auth/
        ├── RegisterIntegrationTests.cs          # existing — extend for unverified-on-create assertion
        └── EmailVerificationIntegrationTests.cs # NEW: verify + resend + expiry/reuse flows

src/ui/apps/web/
├── app/
│   ├── (auth)/
│   │   └── verify-email/
│   │       └── page.tsx                        # NEW: confirmation page, reads token from query string
│   └── api/
│       └── auth/
│           └── verify-email/
│               └── route.ts                    # NEW: BFF proxy → POST /api/auth/verify-email
```

**Structure Decision**: Existing feature-first "Web application" layout (ASP.NET Core `src/api` + Next.js `src/ui/apps/web`) is reused as-is — this feature adds new feature folders (`VerifyEmail`, `ResendVerificationEmail`) inside the existing `Auth` area on both the Application and Api layers, plus one new frontend route group page and its BFF proxy, matching the `Register`/`ExternalLogin` precedent throughout.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
