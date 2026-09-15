# Implementation Plan: Follow Role Restrictions

**Branch**: `main` (trunk-based repo — see Constitution Git & Deploy Workflow; no feature branch is created) | **Date**: 2026-09-15 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/003-follow-role-restrictions/spec.md`

## Summary

Add a role-eligibility gate to the existing Follow feature so that Players may only follow Players, and Agents (`ScoutAgent`) may only follow Players; all other pairings (including anything touching Admin) are rejected with a specific domain error instead of a generic failure. Connections remain untouched. The check is a pure role-pair lookup evaluated in `FollowUserCommandHandler` before the existing self-follow/duplicate-follow checks, backed by a new repository method to resolve a user's role, and surfaced as a small, explicit set of `SocialErrors`.

## Technical Context

**Language/Version**: C# / .NET 10 (`src/api/*.csproj` → `net10.0`); TypeScript / Next.js 16 (`src/ui/apps/web/`)

**Primary Dependencies**: ASP.NET Core minimal APIs, EF Core (PostgreSQL provider), ASP.NET Core Identity (`UserManager<ApplicationUser>`) for role lookups, FluentValidation for command validators, custom `ICommandHandler`/`Result` pattern in `GlobalScout.SharedKernel`

**Storage**: PostgreSQL — no schema change; role comes from the existing ASP.NET Identity `AspNetUserRoles` tables via `UserManager.GetRolesAsync`, already used by `SocialGraphRepository.GetRoleNameAsync` for DTO enrichment

**Testing**: xUnit unit tests (`GlobalScout.Application.UnitTests`) for the eligibility logic and handler; xUnit + Testcontainers integration tests (`GlobalScout.Api.IntegrationTests`, real Postgres) extending the existing `SocialFollowIntegrationTests.cs`

**Target Platform**: Linux containers (Docker Compose / Aspire AppHost), server-side only for this feature — no client-visible surface exists yet to update (see Frontend note below)

**Project Type**: Web application (existing ASP.NET Core API + Next.js frontend) — this feature is backend-only

**Performance Goals**: Negligible — one extra role lookup (existing pattern, already performed elsewhere per-request) added to an already-authenticated, low-frequency write path; no new N+1 or list-scan concerns

**Constraints**: Must not alter behavior for already-allowed pairings (Player→Player, Agent→Player) or for the existing Connections feature; must not retroactively touch existing `Follow` rows; must follow feature-first architecture (Constitution Principle I) — new logic lives under `Social/Follow/`, not a generic/shared location

**Scale/Scope**: Single new pure-logic unit (`FollowEligibility`), one repository method addition, ~4 new `SocialErrors` entries, handler edit, test additions. No new entities, no migration.

**Frontend note**: `src/ui/apps/web/lib/api/follow.ts` (the Follow SDK client) currently has **zero call sites** in the frontend — there is no "Follow" button anywhere in the UI today. Spec User Story 4 / FR-010 ("don't show Follow where disallowed") is therefore satisfied vacuously by this plan: there is nothing to hide yet. It becomes relevant only once a Follow UI ships (tracked as a follow-up, not part of this plan) — see research.md.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Feature-First Clean Architecture (NON-NEGOTIABLE)** — PASS. New eligibility logic goes in `Application/Social/Follow/`, alongside `FollowUserCommandHandler`; the new repository method is added to the existing `ISocialGraphRepository` (`Abstractions/Persistence/`) and implemented in `Infrastructure/Social/Graph/SocialGraphRepository.cs`, matching where role lookups already live for this area. No technical-folder placement introduced.
- **II. Integration Testing with Real Infrastructure (NON-NEGOTIABLE)** — PASS. New scenarios are added to `SocialFollowIntegrationTests.cs`, which already runs against a real Postgres Testcontainer via `IntegrationTestFixture`. No mocking of the database.
- **III. Pragmatic Test Coverage** — PASS. Tests are added because they cover new real behavior (role gate correctness across all pairings), not reflexively.
- **IV. Minimal, Convention-Matching Diffs** — PASS. Diff is scoped to the Follow feature; Connections, Messages, and unrelated Social code are untouched. Sibling files (`SendConnectionRequestCommandHandler.cs`, `SocialErrors.cs`) were read to match error-declaration and handler-check conventions before designing this plan.
- **V. Production URL & CORS Invariants (NON-NEGOTIABLE)** — N/A. No deployment, Docker, nginx, CORS, or object-storage surface touched.

No violations. Complexity Tracking section is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/003-follow-role-restrictions/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md         # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks — not created here)
```

### Source Code (repository root)

```text
src/api/
├── GlobalScout.Domain/
│   └── Identity/
│       ├── UserRole.cs                     # existing — read only, no change
│       └── AppRoleNames.cs                 # existing — ToUserRole(string) reused, no change
├── GlobalScout.Application/
│   ├── Abstractions/Persistence/
│   │   └── ISocialGraphRepository.cs       # + GetUserRoleAsync(Guid, CT)
│   └── Social/
│       ├── SocialErrors.cs                 # + role-restriction errors
│       └── Follow/
│           ├── FollowEligibility.cs        # NEW — pure role-pair rule
│           ├── FollowUserCommandHandler.cs # + eligibility check before create
│           └── UnfollowUserCommandHandler.cs  # unchanged (unfollow always allowed)
├── GlobalScout.Infrastructure/
│   └── Social/Graph/
│       └── SocialGraphRepository.cs        # + GetUserRoleAsync impl (wraps existing GetRoleNameAsync)
├── GlobalScout.Application.UnitTests/
│   └── Social/Follow/
│       ├── FollowEligibilityTests.cs       # NEW — all role-pair combinations
│       └── FollowUserCommandHandlerTests.cs # NEW — handler wires eligibility + existing checks
└── GlobalScout.Api.IntegrationTests/
    └── Social/
        └── SocialFollowIntegrationTests.cs # + role-restriction scenarios (real Postgres, real seeded roles)
```

**Structure Decision**: Existing feature-first backend layout is reused as-is (`Application/Social/Follow/`, `Infrastructure/Social/Graph/`). No frontend source changes are made in this plan since there is no Follow UI to update yet (see Frontend note above); `src/ui/` is unaffected.

## Complexity Tracking

*No Constitution Check violations — section not applicable.*
