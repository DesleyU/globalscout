# GlobalScout — Agent Onboarding

This document is the single starting point for AI agents (and humans) working on GlobalScout. It covers what the project is, how it is structured, where to find domain knowledge, and how to work on it effectively.

---

## What GlobalScout is

GlobalScout is a **football networking platform** connecting players, clubs, scouts, and agents worldwide.

Core capabilities:

- **User authentication** — JWT-based auth with role-based access
- **Profiles** — players, clubs, scouts, agents
- **Social** — connections, follows, messaging (SignalR)
- **Player identity** — search API-Football, claim profiles, admin verification, self-reported claims
- **Player statistics** — fetch/store from API-Football, manual entry, tier-masked views
- **Reference data** — countries, competitions, teams (catalog + API-Football sync + player submissions)
- **Media** — avatars and videos via private S3 presigned URLs
- **Billing** — Premium subscriptions via Stripe Checkout + webhooks

---

## Ignore stale docs

| File | Problem |
|------|---------|
| `README.md` (root) | Describes old Node/Express + Prisma + Supabase stack (`backend/`, `frontend/`) |
| `src/ui/apps/web/README.md` | Generic `create-next-app` boilerplate |

The real stack is **ASP.NET Core + PostgreSQL** (`src/api/`) and **Next.js 16** (`src/ui/`).

---

## Repo layout

```
globalscout/
├── src/api/                          # .NET backend
│   ├── GlobalScout.Api/              # HTTP endpoints, SignalR, Program.cs
│   ├── GlobalScout.Application/      # CQRS handlers, validators, DTOs (feature-first folders)
│   ├── GlobalScout.Domain/           # Entities
│   ├── GlobalScout.Infrastructure/   # EF Core, Stripe, API-Football, S3, repos
│   ├── GlobalScout.Migrator/         # EF migrations runner
│   ├── GlobalScout.AppHost/          # .NET Aspire local dev (preferred)
│   ├── GlobalScout.SharedKernel/     # Shared primitives (errors, etc.)
│   ├── GlobalScout.*.UnitTests/
│   └── GlobalScout.Api.IntegrationTests/
├── src/ui/
│   ├── apps/web/                     # Next.js 16 app (main UI)
│   └── packages/shared/              # Shared TS package
├── docs/                             # Domain & ops docs (read these)
├── deploy/                           # EC2 docker-compose, nginx, env.example
├── docker-compose.yml                # Local full stack (postgres, migrator, api, ui)
├── legacy_frontend/                  # Old React app — do not use
├── .cursor/
│   ├── rules/                        # Always-on / scoped agent rules
│   └── plans/                        # Implementation blueprints with todo tracking
└── .github/workflows/                # CI/CD (dotnet build, AWS deploy)
```

---

## Architecture (backend)

Clean architecture with **feature-first** folders inside each layer. Match existing patterns before adding code.

| Layer | Pattern |
|-------|---------|
| **Application** | `GlobalScout.Application/<Area>/<Feature>/<UseCase>/` — commands, queries, handlers, validators |
| **Infrastructure** | Repos and external integrations under matching folders |
| **Api** | `GlobalScout.Api/Endpoints/<Area>/` — thin route → handler mapping |
| **Messaging** | CQRS via `ICommandHandler` / `IQueryHandler`; errors via typed `*Errors.cs` files |

**Social** example layout:

- `Social/Connections/` — send, respond, list, pending requests
- `Social/Follow/` — follow/unfollow, followers, following, stats
- `Social/Messages/` — send, conversations, mark read (+ SignalR hub)

**Namespace = folder path** in Application layer (e.g. `GlobalScout.Application.Social.Connections.SendConnection`).

### Anti-patterns (avoid)

- Connection handlers outside `Social/Connections/`
- `IMessageRepository` under `Persistence` instead of `Abstractions/Social/Messages/`
- `SocialGraphRepository` directly under `Infrastructure/Social/` (use `Social/Graph/`)
- Message hub/notifier only under `Hubs/` or `RealTime/` (use `Social/Messages/`)

---

## Architecture (frontend)

- Next.js 16 App Router in `src/ui/apps/web/app/`
- BFF route handlers under `app/api/*` proxy to the .NET API with cookie → Bearer forwarding
- UI libs: TanStack Query, shadcn/ui, Tailwind 4, React Hook Form + Zod
- Client API helpers: `src/ui/apps/web/lib/api/`
- Feature modules: `src/ui/apps/web/features/`
- Components: `src/ui/apps/web/components/`

**Important:** This Next.js version may differ from training data. Read `node_modules/next/dist/docs/` and heed `src/ui/apps/web/AGENTS.md` before writing Next.js code.

---

## Production invariants

GlobalScout production runs on AWS: CloudFront → ALB → single EC2 host running Docker Compose.

| Invariant | Value |
|-----------|--------|
| Frontend URLs | `https://globalscout.eu`, `https://www.globalscout.eu` |
| API URL | `https://api.globalscout.eu/api` — not relative `/api` from the frontend domain |
| EC2 Compose services | `ui`, `api`, `postgres`, `migrator` |
| UI container | nginx + Next.js standalone SPA |
| Media | Private S3 with presigned upload/read URLs |
| `media.globalscout.eu` CloudFront | Future/planned unless docs and code say otherwise |

**Before changing deployment, Docker, nginx, frontend API URL handling, CORS, object storage/media, or AWS documentation**, read `docs/AWS-infrastructure_setup_documentation.md`.

---

## Cursor rules (agent constraints)

These live in `.cursor/rules/` and are injected into agent context automatically or when matching files are edited.

| File | Scope | Purpose |
|------|--------|---------|
| `.cursor/rules/aws-production-architecture.mdc` | **Always apply** | Production topology, canonical URLs, S3 media, Compose stack. Points to AWS infra doc. |
| `.cursor/rules/globalscout-feature-first-architecture.mdc` | `src/api/**/*.cs` | Feature-first folder layout, namespaces, layer boundaries, Social structure, anti-patterns. |

---

## Cursor plans (implementation blueprints)

| File | Status | Purpose |
|------|--------|---------|
| `.cursor/plans/reference_data_catalog_27aa6fea.plan.md` | Active — most todos completed; frontend pickers + admin curation pending | Reference data catalog: retire JSON, DB catalog, API-Football sync, write-through team search, player submissions, admin review. Mirrors `docs/REFERENCE-DATA.md`. |

Plans are task-specific design docs with todo tracking. Rules are ongoing constraints.

---

## Domain documentation (`docs/`)

Read the relevant doc **before** touching that area. These are the best domain-specific guides — layered responsibility tables, HTTP surfaces, and operational notes.

### Architecture & deployment

| Doc | Purpose |
|-----|---------|
| `docs/AWS-infrastructure_setup_documentation.md` | **Primary** production infra reference: Route 53, CloudFront, ALB, EC2, Compose, S3, env vars, troubleshooting (~900+ lines). |
| `docs/AWS-GITHUB-DEPLOYMENT.md` | CI/CD: ECR images (`ui`, `api`, `migrator`), GitHub Actions deploy workflow, EC2 SSH deploy. |
| `docs/useful commands.txt` | Operator cheat sheet: prod DB shell, Compose paths, deploy SCP/SSH, routing curls. |

### Feature / domain flows

| Doc | Purpose |
|-----|---------|
| `docs/REFERENCE-DATA.md` | Countries (static), competitions/teams catalog, sync, search, submissions, admin endpoints, first-run sync. |
| `docs/PLAYER-STATISTICS.md` | Stats refresh from API-Football, JSONB storage, cooldown, manual entry, tier masking. |
| `docs/BILLING-FLOW.md` | Stripe checkout → webhook → entitlements (`account_type`, `subscriptions`). |
| `docs/STRIPE-BILLING.md` | Local Stripe dev: secrets, CLI webhook forwarding, test setup. |

### UI / design

| Doc | Purpose |
|-----|---------|
| `docs/figma-specs.md` | Large Next.js implementation guide: app route tree, onboarding screens, component patterns. |
| `docs/onboarding-figma/` | Figma exports: PNGs + `AuthFlow.tsx`, `OnboardingFlow.tsx` reference implementations. |

---

## App-specific agent hints

| File | Purpose |
|------|---------|
| `src/ui/apps/web/AGENTS.md` | Warns that this Next.js version differs from standard training data — read `node_modules/next/dist/docs/` before coding. |
| `src/ui/apps/web/CLAUDE.md` | Thin pointer: `@AGENTS.md`. |

---

## Deploy templates & CI

| Location | Purpose |
|----------|---------|
| `deploy/docker-compose.ec2.yml` | Production Compose stack on EC2. |
| `deploy/nginx.ec2.conf` | nginx routing inside the UI container. |
| `deploy/env.example` | Required prod env vars (JWT, Stripe, ApiFootball, S3, etc.). |
| `docker-compose.yml` (root) | Local full stack alternative to Aspire. |
| `.github/workflows/deploy-aws.yml` | AWS deploy pipeline. |
| `.github/workflows/dotnet-build.yml` | .NET build/test CI. |

---

## Key API surface

Endpoints live in `src/api/GlobalScout.Api/Endpoints/`:

| Folder | Purpose |
|--------|---------|
| `Auth/` | Login, register, token refresh |
| `Account/` | Account type, role, downgrade |
| `Users/` | Profiles, avatars, recommendations |
| `PlayerIdentity/` | Search, claims, self-reported claims, evidence |
| `ReferenceData/` | Countries, teams/competitions search/list/submit |
| `Admin/` | Users, claims queue, reference data sync/curation |
| `Stats/` | Read/refresh/manual stats |
| `Billing/` | Stripe checkout, portal, webhook |
| `Social/` | Connections, follow, messages (+ SignalR hub) |
| `Media/` | Avatars, videos |

Config template: `src/api/GlobalScout.Api/appsettings.json`  
Prod env template: `deploy/env.example`

---

## External integrations

| Service | Usage |
|---------|--------|
| **API-Football** (`v3.football.api-sports.io`) | Player search, stats refresh, reference data country sync, write-through club search |
| **Stripe** | Premium subscriptions; webhook-driven entitlement sync to `account_type` + `subscriptions` |
| **S3** | Avatars and media via presigned URLs (Ministack locally, real S3 in prod) |

---

## Local development

### Preferred: .NET Aspire AppHost

`src/api/GlobalScout.AppHost/AppHost.cs`

Runs Postgres, Ministack (local S3), API, and Next.js with correct `NEXT_PUBLIC_API_BASE_URL` and CORS origins.

### Alternate: Docker Compose

From repo root:

```bash
docker compose up
```

Services: postgres → migrator → api → ui (see `docker-compose.yml`).

### Tests

From `src/api/`:

```bash
dotnet test
```

Frontend (from `src/ui/apps/web/`):

```bash
pnpm typecheck
pnpm lint
```

---

## Runtime / data access

| Resource | Purpose |
|----------|---------|
| **MCP `user-globalscout-postgres`** | Query Postgres from the agent (schema inspection, debugging) — if configured in Cursor. |
| **Agent transcripts** | Past chat sessions in Cursor's project folder — useful for "why we did X" context. |

---

## User-level Cursor skills (not in repo)

No `SKILL.md` files exist inside this project. Agents can use global Cursor skills when relevant:

| Skill | Purpose |
|-------|---------|
| `create-rule` | Extend `.cursor/rules/` project guidance |
| `create-skill` | Author new agent skills |
| `babysit` | PR/CI triage loop |
| `split-to-prs` | Break large branches into reviewable PRs |
| `review-bugbot` | Code change review |
| `review-security` | Security review of changes |
| `canvas` | Rich analytical UIs |

These live under the user's Cursor skills directory, not in the GlobalScout repo.

---

## Working rules

1. **Minimize scope** — smallest correct diff; don't refactor unrelated code.
2. **Match conventions** — read surrounding files before adding new ones; namespace = folder path in Application layer.
3. **Don't commit** unless explicitly asked.
4. **Don't push** unless explicitly asked.
5. **Run commands yourself** — investigate with tools, don't guess.
6. **Tests** — add only when they cover real behavior or are requested.
7. **Deployment changes** — read AWS docs + rules first; preserve URL/CORS invariants.
8. **Comments** — only for non-obvious business logic; code should be self-explanatory.

---

## Quick "where do I look?"

| Task | Start here |
|------|------------|
| New API endpoint | Mirror sibling in `Endpoints/`, handler in `Application/`, repo in `Infrastructure/` |
| New UI page | `src/ui/apps/web/app/`, components in `components/` or `features/` |
| DB schema change | `GlobalScout.Infrastructure/Data/`, migration via Migrator project |
| Identity / claims | `Application/PlayerIdentity/`, onboarding components in `components/onboarding/` |
| Admin features | `Endpoints/Admin/`, `app/(app)/admin/` in UI |
| Billing | `Application/Billing/`, `Infrastructure/Billing/`, `docs/BILLING-FLOW.md` |
| Reference data | `Application/ReferenceData/`, `docs/REFERENCE-DATA.md` |
| Statistics | `Application/Statistics/`, `docs/PLAYER-STATISTICS.md` |

---

## First task checklist

1. Skim this document and `.cursor/rules/aws-production-architecture.mdc`.
2. If touching backend: read `.cursor/rules/globalscout-feature-first-architecture.mdc`.
3. If touching a domain: read the matching `docs/*.md`.
4. Find 2–3 similar existing files and copy their patterns.
5. Run `dotnet test` (and UI `typecheck`/`lint` if you changed frontend).

---

## Copy-paste prompt for a new agent session

Paste the block below as the first message to a new agent working on this repo:

```
You are working on GlobalScout (football networking platform). Read docs/AGENT-ONBOARDING.md first.

Stack: ASP.NET Core API (src/api/) + Next.js 16 UI (src/ui/apps/web/) + PostgreSQL.
Ignore root README.md (stale Node/Express docs).

Before coding:
- Backend (src/api/**/*.cs): follow .cursor/rules/globalscout-feature-first-architecture.mdc
- Deploy/CORS/Docker/nginx: follow .cursor/rules/aws-production-architecture.mdc + docs/AWS-infrastructure_setup_documentation.md
- Domain work: read the matching doc in docs/ (REFERENCE-DATA.md, PLAYER-STATISTICS.md, BILLING-FLOW.md, etc.)
- Next.js: read src/ui/apps/web/AGENTS.md — this Next version may differ from training data

Local dev: Aspire AppHost (src/api/GlobalScout.AppHost/) or docker compose up.
Tests: dotnet test from src/api/.

Rules: minimize scope, match existing patterns, don't commit/push unless asked, run commands yourself.
```
