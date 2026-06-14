# Stage 06: Player Onboarding Flow

## Goal

Implement the authenticated player identity linking and verification onboarding flow.

This stage turns the Figma/PDF onboarding concept into real Next.js routes backed by the implemented player identity API.

## Source Of Truth

Read first:

- `docs/next-web-platform-plan.md`
- `docs/figma-specs.md`
- `docs/Global Scout – Player Identity Linking & Verification.pdf`
- `src/api/GlobalScout.Api/Endpoints/PlayerIdentity/**`
- `src/api/GlobalScout.Application/PlayerIdentity/PlayerIdentityDtos.cs`

## Scope

- Implement the protected `/onboarding/...` route group.
- Build the player onboarding screens.
- Call the real player identity backend endpoints.
- Support evidence file upload and URL/social evidence.
- Hand off to dashboard pending-verification state after submission.

## Routes

```text
/onboarding/account-type
/onboarding/player/empty-profile
/onboarding/player/connect
/onboarding/player/searching
/onboarding/player/match-results
/onboarding/player/claim
/onboarding/player/submitted
```

## Expected Files

- `src/ui/apps/web/app/(onboarding)/onboarding/layout.tsx`
- `src/ui/apps/web/app/(onboarding)/onboarding/account-type/page.tsx`
- `src/ui/apps/web/app/(onboarding)/onboarding/player/**/page.tsx`
- `src/ui/apps/web/features/onboarding/player/**`
- `src/ui/apps/web/components/onboarding/**`
- `src/ui/apps/web/lib/api/player-identity.ts`
- `src/ui/apps/web/lib/storage/**`

## Flow

```text
Sign in
  -> /onboarding/account-type
  -> /onboarding/player/empty-profile
  -> /onboarding/player/connect
  -> /onboarding/player/searching
  -> /onboarding/player/match-results
  -> /onboarding/player/claim
  -> /onboarding/player/submitted
  -> /dashboard
```

## Core Components

- `OnboardingHeader`
- `AccountTypeCard`
- `EmptyProfileSkeleton`
- `ConnectIdentityCard`
- `PlayerIdentityForm`
- `SearchingAnimation`
- `MatchResultCard`
- `ClaimProfileComparison`
- `EvidenceUpload`
- `VerificationTimeline`
- `SubmittedInfoCard`

## Backend Integration

Use:

```text
POST api/player-identity/search
POST api/player-identity/claims
GET  api/player-identity/claims/me
POST api/player-identity/claims/me/evidence/upload-url
POST api/player-identity/claims/me/evidence/complete
POST api/player-identity/claims/me/evidence/link
```

## Implementation Notes

- Route protection must require an authenticated `PLAYER`.
- Use React Hook Form + Zod for identity and evidence forms.
- Preserve onboarding draft state across steps. Prefer URL/query params plus server-backed claim state where possible; avoid fragile in-memory-only state for critical data.
- Selecting a match creates a claim but does not verify the player.
- Use `GET api/player-identity/claims/me` to render current status and avoid duplicate claims.
- Support the backend evidence types exactly.
- Treat Figma code as visual guidance only; adapt to latest stable Tailwind v4 and shadcn/Base UI components.

## Acceptance Criteria

- Player can enter identity details and search candidates.
- Candidate results show confidence score, recommendation state, and match reasons.
- Player can select a candidate and create a claim.
- Player can submit file evidence through presigned upload.
- Player can submit URL/social evidence.
- Submitted screen explains pending admin review.
- Existing claim status can be reloaded from the backend.
- Lint and type checks pass.

## Handoff

After this stage, player onboarding is usable against the real backend and ready for dashboard verification-state integration.
