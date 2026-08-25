# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Start here

Read [docs/AGENT-ONBOARDING.md](docs/AGENT-ONBOARDING.md) first — it is the maintained source of truth for this repo's architecture, domain docs, and working rules. This file is a thin index on top of it for Claude Code specifically; don't duplicate edits between the two, update AGENT-ONBOARDING.md for anything substantive.

**Ignore root `README.md`** — it describes a stale Node/Express + Prisma + Supabase stack. The real stack is ASP.NET Core (`src/api/`) + Next.js 16 (`src/ui/apps/web/`) + PostgreSQL. `legacy_frontend/` is also dead — do not use.

## What this is

GlobalScout — a football networking platform connecting players, clubs, scouts, and agents (auth, profiles, connections/follows/messaging via SignalR, player identity claims, statistics from API-Football, reference data catalog, S3 media, Stripe billing).

## Commands

**Local dev (preferred): .NET Aspire AppHost** — runs Postgres, local S3 (Ministack), API, and Next.js together with correct CORS/env wiring:
```
dotnet run --project src/api/GlobalScout.AppHost
```

**Alternate: Docker Compose** (postgres → migrator → api → ui), from repo root:
```
docker compose up
```

**Backend tests**, from `src/api/`:
```
dotnet test
```
Run a single test project: `dotnet test GlobalScout.Application.UnitTests`. Filter to one test: `dotnet test --filter "FullyQualifiedName~TestName"`.

**Frontend**, from `src/ui/apps/web/`:
```
pnpm typecheck
pnpm lint
pnpm dev      # --turbopack
```
Or via root `package.json` scripts (`pnpm dev:web`, `typecheck:web`, `lint:web`, etc.), which proxy into `src/ui`.

## Architecture, in brief

- **Backend**: Clean Architecture, **feature-first** folders within each layer (not technical folders). `Application/<Area>/<Feature>/<UseCase>/` for CQRS handlers, `Api/Endpoints/<Area>/` for thin route→handler mapping, `Infrastructure/<Area>/` for repos/integrations. Namespace = folder path. Before adding backend code, read [.cursor/rules/globalscout-feature-first-architecture.mdc](.cursor/rules/globalscout-feature-first-architecture.mdc) — it lists concrete anti-patterns (e.g. connection handlers outside `Social/Connections/`) and the repo currently has some legacy code that violates them; match the *rule*, not every existing sibling file.
- **Frontend**: Next.js 16 App Router. BFF route handlers under `app/api/*` proxy to the .NET API (cookie → Bearer forwarding). This Next.js version differs meaningfully from training data — read `node_modules/next/dist/docs/` and [src/ui/apps/web/AGENTS.md](src/ui/apps/web/AGENTS.md) before writing Next.js code.
- **Production**: AWS — CloudFront → ALB → single EC2 host running Docker Compose (`ui`, `api`, `postgres`, `migrator`). Canonical URLs and CORS are load-bearing invariants (`https://globalscout.eu` frontend, `https://api.globalscout.eu/api` — never relative `/api`). Before touching deployment, Docker, nginx, CORS, or object storage, read [docs/AWS-infrastructure_setup_documentation.md](docs/AWS-infrastructure_setup_documentation.md) and [.cursor/rules/aws-production-architecture.mdc](.cursor/rules/aws-production-architecture.mdc).
- **Domain docs** — read the matching one before touching that area: [docs/REFERENCE-DATA.md](docs/REFERENCE-DATA.md), [docs/PLAYER-STATISTICS.md](docs/PLAYER-STATISTICS.md), [docs/BILLING-FLOW.md](docs/BILLING-FLOW.md), [docs/STRIPE-BILLING.md](docs/STRIPE-BILLING.md).

## Git & deploy workflow

- **Trunk-based, single branch**: all work happens directly on `main`. Don't create feature branches or PRs unless explicitly asked.
- The user pushes via **GitHub Desktop**, not this CLI — commit locally when asked, but leave pushing to them unless told otherwise.
- CI (`.github/workflows/dotnet-build.yml`) builds + tests automatically on every push to `main`.
- **Deploy is manual**, not automatic on push: `.github/workflows/deploy-aws.yml` only runs on `workflow_dispatch` (triggered by hand from GitHub Actions). Pushing to `main` does not ship to AWS by itself.

## Working rules

- Minimize scope — smallest correct diff, don't refactor unrelated code.
- Match existing conventions — read 2-3 sibling files before adding a new one.
- Don't commit or push unless explicitly asked.
