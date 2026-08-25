<!--
Sync Impact Report
- Version change: [TEMPLATE] → 1.0.0 (initial ratification)
- Modified principles: n/a (first filled version; template placeholders replaced)
- Added sections:
  - I. Feature-First Clean Architecture (NON-NEGOTIABLE)
  - II. Integration Testing with Real Infrastructure (NON-NEGOTIABLE)
  - III. Pragmatic Test Coverage
  - IV. Minimal, Convention-Matching Diffs
  - V. Production URL & CORS Invariants (NON-NEGOTIABLE)
  - Technology Stack
  - Git & Deploy Workflow
  - Governance
- Removed sections: none (template scaffold only)
- Follow-up TODOs: none
-->

# GlobalScout Constitution

## Core Principles

### I. Feature-First Clean Architecture (NON-NEGOTIABLE)
Backend code MUST be organized by feature, not by technical layer. Within each Clean
Architecture layer, group by `<Area>/<Feature>/<UseCase>`: `Application/<Area>/<Feature>/<UseCase>/`
for CQRS handlers, `Api/Endpoints/<Area>/` for thin route→handler mapping, `Infrastructure/<Area>/`
for repositories and integrations. Namespace MUST mirror the folder path. New code MUST follow
`.cursor/rules/globalscout-feature-first-architecture.mdc` even where existing legacy siblings
violate it — match the rule, not every neighboring file. Rationale: the codebase has accumulated
technical-folder legacy code; without an explicit, non-negotiable rule, new work silently copies
the wrong pattern instead of converging on the intended architecture.

### II. Integration Testing with Real Infrastructure (NON-NEGOTIABLE)
Integration tests MUST exercise real infrastructure via Testcontainers — never mocks or in-memory
fakes for infrastructure dependencies (database, object storage). Tests spin up real PostgreSQL and
S3 (Ministack) containers and wire them into a `WebApplicationFactory<Program>`, per the existing
pattern in `src/api/GlobalScout.Api.IntegrationTests/IntegrationTestFixture.cs`. Unit tests
(`GlobalScout.*.UnitTests`) are for pure application/domain logic and MAY mock abstractions there.
Rationale: mocked repositories cannot catch real SQL/migration errors or real bucket-behavior bugs;
Testcontainers is the only integration-test strategy this project trusts for infrastructure-facing
code.

### III. Pragmatic Test Coverage
Tests are added when they cover real behavior or are explicitly requested by the user — not
reflexively for every change. There is no TDD mandate; tests-first is not required. Rationale:
avoids busywork tests that assert nothing meaningful and slow down iteration on a project with a
small team.

### IV. Minimal, Convention-Matching Diffs
Changes MUST use the smallest correct diff; unrelated code MUST NOT be refactored as a side effect
of an unrelated task. Before adding a new file, read 2-3 sibling files to match existing
conventions. Rationale: keeps reviews small and predictable, and prevents unrequested scope creep
from obscuring the actual change.

### V. Production URL & CORS Invariants (NON-NEGOTIABLE)
Canonical production URLs are load-bearing and MUST NOT change casually: frontend is
`https://globalscout.eu`, API is `https://api.globalscout.eu/api` (never a relative `/api`). Any
change touching deployment, Docker, nginx, CORS, or object storage MUST first be checked against
`docs/AWS-infrastructure_setup_documentation.md` and `.cursor/rules/aws-production-architecture.mdc`.
Rationale: the production topology (CloudFront → ALB → single EC2 host running Docker Compose) has
narrow, easy-to-break CORS/URL wiring; skipping the docs has historically broken prod.

## Technology Stack

GlobalScout is a football networking platform connecting players, clubs, scouts, and agents:
auth, profiles, connections/follows/messaging via SignalR, player identity claims, statistics
from API-Football, a reference data catalog, S3 media, and Stripe billing.

- **Backend**: ASP.NET Core (`src/api/`), Clean Architecture, feature-first folders (see
  Principle I).
- **Frontend**: Next.js 16 App Router (`src/ui/apps/web/`). BFF route handlers under `app/api/*`
  proxy to the .NET API (cookie → Bearer forwarding).
- **Database**: PostgreSQL.
- **Production infrastructure**: AWS — CloudFront → ALB → a single EC2 host running Docker
  Compose (`ui`, `api`, `postgres`, `migrator`).

Ignore root `README.md` (describes a stale Node/Express + Prisma + Supabase stack) and
`legacy_frontend/` (dead code) — both are not the real stack.

## Git & Deploy Workflow

- **Trunk-based, single branch**: all work happens directly on `main`. Feature branches or PRs
  MUST NOT be created unless explicitly asked.
- Commits and pushes MUST NOT happen unless the user explicitly asks. The user pushes via GitHub
  Desktop, not the agent.
- CI (`.github/workflows/dotnet-build.yml`) builds and tests automatically on every push to `main`.
- **Deploy is manual**: `.github/workflows/deploy-aws.yml` runs only on `workflow_dispatch`.
  Pushing to `main` does not ship to AWS by itself.

## Governance

This constitution supersedes conflicting guidance in ad hoc conversation or older docs for the
principles it covers; where it is silent, defer to `docs/AGENT-ONBOARDING.md`, `CLAUDE.md`, and
the `.cursor/rules/*.mdc` files.

- **Amendments**: proposed and applied via the `/speckit-constitution` command (or equivalent
  direct edit reviewed by the user), not ad hoc. Each amendment updates the Sync Impact Report at
  the top of this file.
- **Versioning policy**: semantic versioning for this document —
  MAJOR for backward-incompatible principle removals/redefinitions, MINOR for a new principle or
  materially expanded guidance, PATCH for clarifications and wording fixes.
- **Compliance review**: `/speckit-plan`, `/speckit-tasks`, and `/speckit-analyze` outputs MUST be
  checked against these principles before implementation; a plan that violates a NON-NEGOTIABLE
  principle MUST document the justification or be revised. Complexity beyond what a principle
  allows MUST be justified in the relevant spec/plan, not silently introduced.

**Version**: 1.0.0 | **Ratified**: 2026-08-24 | **Last Amended**: 2026-08-24
