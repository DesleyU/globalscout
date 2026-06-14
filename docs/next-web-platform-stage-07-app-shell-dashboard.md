# Stage 07: App Shell And Dashboard Skeleton

## Goal

Build the authenticated app shell and initial dashboard surfaces for pending and verified player states.

This stage gives authenticated users a coherent home after sign-in and onboarding.

## Source Of Truth

Read first:

- `docs/next-web-platform-plan.md`
- `docs/figma-specs.md`
- `src/api/GlobalScout.Api/Endpoints/Users/**`
- `src/api/GlobalScout.Api/Endpoints/PlayerIdentity/**`

## Scope

- Implement the authenticated `(app)` layout.
- Add primary navigation.
- Implement dashboard pending and verified states.
- Add verification banner driven by player identity claim status.
- Add route skeletons for major product areas.

## Routes

```text
/dashboard
/dashboard/verified
/profile
/search
/users/[id]
/connections
/messages
/messages/[userId]
/billing
/billing/success
/billing/cancel
```

## Expected Files

- `src/ui/apps/web/app/(app)/layout.tsx`
- `src/ui/apps/web/app/(app)/dashboard/page.tsx`
- `src/ui/apps/web/app/(app)/dashboard/verified/page.tsx`
- `src/ui/apps/web/app/(app)/**`
- `src/ui/apps/web/components/layout/DashboardSidebar.tsx`
- `src/ui/apps/web/components/layout/DashboardHeader.tsx`
- `src/ui/apps/web/components/dashboard/**`
- `src/ui/apps/web/features/dashboard/**`

## Core Components

- `DashboardSidebar`
- `DashboardHeader`
- `VerificationBanner`
- `PlayerProfileHeader`
- `StatCard`
- `VideoHighlightCard`
- `PerformanceRadarChart`
- `ProfileViewsChart`
- `MatchHistoryList`
- `RecentActivityList`

## Implementation Notes

- Use role-aware navigation.
- Keep player, scout/agent, and admin role differences extensible.
- Use `GET api/player-identity/claims/me` to decide pending/verified/rejected verification UI.
- Do not implement every downstream feature deeply in this stage. Route skeletons are acceptable for profile/search/connections/messages if the dashboard shell is the main scope.
- Use Recharts for charts where useful, with Tremor-style visuals built through local components.

## Acceptance Criteria

- Authenticated users see a consistent app shell.
- Dashboard renders pending verification state for unverified/pending players.
- Dashboard renders verified state for verified players.
- Primary navigation links to planned product areas.
- Route guards prevent unauthenticated access.
- Lint and type checks pass.

## Handoff

After this stage, the app has a real authenticated home and can support deeper feature implementation in later passes.
