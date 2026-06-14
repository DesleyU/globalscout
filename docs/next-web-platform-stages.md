# Next.js Web Platform Stages

Use `docs/next-web-platform-plan.md` as the source of truth. These stage documents break the work into agent-sized implementation briefs.

## Implementation Order

1. [Stage 01: Workspace And Next.js Scaffold](next-web-platform-stage-01-workspace-scaffold.md)
2. [Stage 02: Aspire And Environment Integration](next-web-platform-stage-02-aspire-integration.md)
3. [Stage 03: Shared Types And API Clients](next-web-platform-stage-03-shared-types-api-clients.md)
4. [Stage 04: Auth Foundation](next-web-platform-stage-04-auth-foundation.md)
5. [Stage 05: Landing Page](next-web-platform-stage-05-landing-page.md)
6. [Stage 06: Player Onboarding Flow](next-web-platform-stage-06-player-onboarding.md)
7. [Stage 07: App Shell And Dashboard Skeleton](next-web-platform-stage-07-app-shell-dashboard.md)
8. [Stage 08: Admin Player Claims UI](next-web-platform-stage-08-admin-player-claims.md)
9. [Stage 09: Docker, CI, And Deployment Cutover](next-web-platform-stage-09-docker-ci-cutover.md)

## Coordination Notes

- Each agent should read `docs/next-web-platform-plan.md` and its assigned stage document before coding.
- If implementation changes the architecture, update both the relevant stage document and `docs/next-web-platform-plan.md`.
- Complete stages in order unless a later stage is explicitly split into a separate branch or draft-only exploration.
- Keep the legacy `frontend/` as a temporary reference, not a design constraint.
