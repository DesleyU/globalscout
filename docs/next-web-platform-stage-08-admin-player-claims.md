# Stage 08: Admin Player Claims UI

## Goal

Implement the admin interface for reviewing player identity claims.

This stage completes the manual verification loop required by player onboarding.

## Source Of Truth

Read first:

- `docs/next-web-platform-plan.md`
- `src/api/GlobalScout.Api/Endpoints/Admin/GetAdminPlayerClaims.cs`
- `src/api/GlobalScout.Api/Endpoints/Admin/PostAdminPlayerClaims.cs`
- `src/api/GlobalScout.Application/PlayerIdentity/PlayerIdentityDtos.cs`

## Scope

- Add admin-only route protection.
- Build pending claims queue.
- Add approve, reject, and request-more-info actions.
- Display claim details, candidate match data, confidence score, evidence, and admin note controls.

## Routes

```text
/admin/player-claims
```

The route may live under the existing admin route structure if the app shell already defines one.

## Expected Files

- `src/ui/apps/web/app/(app)/admin/player-claims/page.tsx`, or equivalent admin route
- `src/ui/apps/web/features/admin/player-claims/**`
- `src/ui/apps/web/lib/api/admin.ts`
- `src/ui/apps/web/components/admin/**`

## Backend Integration

Use:

```text
GET  api/admin/player-claims
POST api/admin/player-claims/{claimId}/approve
POST api/admin/player-claims/{claimId}/reject
POST api/admin/player-claims/{claimId}/request-info
```

## UI Requirements

- Pending claims list.
- Claim detail view.
- User identity: user id, email, optional full name.
- Candidate profile details.
- Confidence score and match reasons when available through the claim data.
- Evidence list with file/link distinction.
- Approve action with optional note.
- Reject action with required note.
- Request more information action with required note.

## Implementation Notes

- Use TanStack Table if the claims queue needs sorting/filtering/pagination.
- Keep admin actions mutation-driven with cache invalidation.
- Do not expose admin routes to non-admin users.
- The current backend request-info action stores admin note/review metadata without a separate `NeedsMoreInformation` status enum. Render this according to returned backend state.

## Acceptance Criteria

- Admin can view pending claims.
- Admin can approve a claim.
- Admin can reject a claim with a note.
- Admin can request more information with a note.
- Claim queue refreshes after actions.
- Non-admin users cannot access the UI.
- Lint and type checks pass.

## Handoff

After this stage, the player onboarding verification lifecycle is complete from player submission through admin review.
