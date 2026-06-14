# Stage 03: Shared Types And API Clients

## Goal

Create the typed API foundation used by the Next.js app and future Expo app.

This stage should wire the frontend to existing backend contracts, especially the implemented player identity endpoints.

## Source Of Truth

Read first:

- `docs/next-web-platform-plan.md`
- `src/api/GlobalScout.Api/Endpoints/PlayerIdentity/**`
- `src/api/GlobalScout.Api/Endpoints/Admin/GetAdminPlayerClaims.cs`
- `src/api/GlobalScout.Api/Endpoints/Admin/PostAdminPlayerClaims.cs`
- `src/api/GlobalScout.Application/PlayerIdentity/PlayerIdentityDtos.cs`
- `src/api/GlobalScout.Domain/PlayerIdentity/**`

## Scope

- Build shared TypeScript types for stable API models.
- Build shared URL/error/transport helpers in `src/ui/packages/shared`.
- Build web-specific API adapters in `src/ui/apps/web/lib/api`.
- Add typed player identity client methods for all implemented player and admin endpoints.
- Add evidence upload helper support for presigned upload URL flows.

## Expected Files

- `src/ui/packages/shared/src/**`
- `src/ui/apps/web/lib/api/**`
- `src/ui/apps/web/lib/storage/**`
- `src/ui/apps/web/lib/env/**`
- `src/ui/apps/web/lib/validation/**`

## Required API Clients

Create or plan modules for:

- `auth`
- `account`
- `users`
- `stats`
- `media`
- `billing`
- `connections`
- `follow`
- `messages`
- `admin`
- `player-identity`

## Player Identity Contracts

Player endpoints require the `PLAYER` role:

```text
POST api/player-identity/search
POST api/player-identity/claims
GET  api/player-identity/claims/me
POST api/player-identity/claims/me/evidence/upload-url
POST api/player-identity/claims/me/evidence/complete
POST api/player-identity/claims/me/evidence/link
```

Admin endpoints require the `ADMIN` role:

```text
GET  api/admin/player-claims
POST api/admin/player-claims/{claimId}/approve
POST api/admin/player-claims/{claimId}/reject
POST api/admin/player-claims/{claimId}/request-info
```

Model these backend DTOs:

- `PlayerIdentitySearchRequest`
- `CreatePlayerIdentityClaimRequest`
- `InitiateEvidenceUploadRequest`
- `CompleteEvidenceUploadRequest`
- `AddLinkEvidenceRequest`
- `SearchPlayersResult`
- `PlayerMatchDto`
- `PlayerIdentityClaimDto`
- `GetMyPlayerIdentityClaimResult`
- `VerificationEvidenceDto`
- `ListPendingPlayerClaimsResult`

Evidence types:

```text
RosterListing
FederationCard
ClubId
ProfileUrl
SocialAccount
Other
Passport
CountryPersonalId
```

Claim statuses:

```text
Unmatched
Suggested
Claimed
PendingVerification
Verified
Rejected
```

## Implementation Notes

- Keep cross-platform types and pure helpers in `src/ui/packages/shared`.
- Keep cookie/session-aware Next adapters in `src/ui/apps/web`.
- Browser calls must use the configured absolute API base URL unless a Next route handler intentionally owns the operation.
- Normalize backend errors into typed frontend errors.
- Do not generate UI in this stage.

## Acceptance Criteria

- TypeScript can import shared contracts from `src/ui/packages/shared`.
- `src/ui/apps/web` has typed API clients for player identity and core domains.
- Evidence upload helper supports upload URL, S3 PUT, and complete/link submission flows.
- API clients can be used from later sign-in and onboarding stages without reworking the structure.

## Handoff

After this stage, UI agents should be able to build forms and screens against typed API functions rather than raw `fetch` calls.
