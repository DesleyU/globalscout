# Phase 0 Research: Follow Role Restrictions

No `NEEDS CLARIFICATION` markers were left in the Technical Context — this feature reuses existing
patterns throughout. This document records the decisions made while confirming that.

## Decision: Where does role come from at follow-time?

**Decision**: Add `Task<UserRole?> GetUserRoleAsync(Guid userId, CancellationToken)` to
`ISocialGraphRepository`, implemented in `SocialGraphRepository` by reusing the private
`GetRoleNameAsync(Guid, CancellationToken)` helper (already calls
`userManager.GetRolesAsync(...)`) and converting the result via the existing
`AppRoleNames.ToUserRole(string)` mapper.

**Rationale**: `SocialGraphRepository` already resolves role-per-user for DTO enrichment
(`GetRoleNameAsync`, used 6+ times in that file for Connections/Follow list responses) via
`UserManager<ApplicationUser>.GetRolesAsync`. There is no separate "role service" in this codebase
— role lookups for social features live in this repository already. Reusing the existing private
helper (promoted to also back a new public interface method) avoids a second code path for the
same lookup and keeps the change inside the Social/Follow area per Constitution Principle I.

**Alternatives considered**:
- *Fetch role via `IUserIdentityStore.GetProfileAsync`*: rejected — that path returns a much larger
  `GetAuthProfileResult` (email, status, account type, full profile payload) for a single string
  field, and `IUserIdentityStore` is an Auth-area abstraction, not Social — pulling it into
  `FollowUserCommandHandler` would cross a feature boundary for no benefit when `ISocialGraphRepository`
  already has everything needed.
- *Pass the caller's role in from the API layer (claims) and look up only the target's role*:
  rejected — the follower's role in the auth token could be stale relative to the database at the
  moment of the call (e.g. mid role-change), and the existing pattern in this handler already
  re-verifies state server-side (e.g. `UserExistsAsync`) rather than trusting caller-supplied
  claims for business rules.

## Decision: How is the eligibility rule expressed and tested?

**Decision**: A small pure static class, `FollowEligibility`, in
`Application/Social/Follow/FollowEligibility.cs`, exposing
`Result Evaluate(UserRole followerRole, UserRole targetRole)` (or equivalent), returning
`Result.Success()` or a specific `SocialErrors` entry. `FollowUserCommandHandler` calls it after
resolving both roles and before the existing self-follow / already-following checks (cheapest,
most specific checks first is the existing handler's ordering convention).

**Rationale**: Matches the codebase's existing style of small, directly-unit-testable pure checks
inside a handler (see `FollowUserCommandHandler`'s existing sequential `if` returns). A pure static
evaluator is trivially exhaustively unit tested against all `UserRole × UserRole` pairs without
mocking the repository, and keeps `FollowUserCommandHandler` readable as a short sequence of
guard clauses, matching the existing handler shape rather than introducing a new abstraction
(pipeline behavior, spec/rule object, etc.) that the codebase doesn't otherwise use for this kind
of check — Constitution Principle IV (minimal, convention-matching diffs) rules out a heavier
pattern here.

**Alternatives considered**:
- *MediatR-style pipeline/authorization behavior*: rejected — this codebase's `ICommandHandler`
  pattern doesn't use pipeline behaviors elsewhere for business-rule gates (only for cross-cutting
  concerns, if any); introducing one for a single handler would be a new architectural concept for
  no reuse benefit yet.
- *Encode the rule as data (a permitted-pairs table/config)*: rejected as over-engineering for
  four fixed pairings that the spec states explicitly and that change rarely enough (a role model
  change) that a recompile is an acceptable cost; a hardcoded switch is clearer to read and review
  than indirection through configuration.

## Decision: Error shape for rejections

**Decision**: Add distinct `SocialErrors` entries so the rejection reason is specific per FR-006 /
SC-002 (e.g. `FollowRestrictedToPlayers` for a Player target attempted by a non-Player-eligible
follower context, `AgentsCanOnlyFollowPlayers`, `AdminNotInFollowGraph`), following the exact
pattern already used for `CannotFollowSelf`, `AlreadyFollowing`, `NotFollowing` in
`SocialErrors.cs` (`Error.Problem("Social.<Code>", "<message>")`).

**Rationale**: The spec's User Story 3 and FR-006 explicitly require a message that lets a user or
support agent identify *which* rule was violated, not a single generic "not allowed." The existing
`SocialErrors` static class is already the established location and shape for this kind of
domain error in this feature area (see `ConnectionLimitReached` for a parameterized example) — no
new error-handling mechanism is needed, only additional entries.

**Alternatives considered**:
- *Single generic `FollowRoleNotAllowed` error with a dynamic message string built from both
  roles*: rejected — while it would reduce the number of static fields, it produces a less
  reviewable/discoverable API surface (call sites can't see the possible messages at a glance) and
  makes unit-testing "the right message for the right pairing" slightly more awkward than
  asserting against named constants; the existing file already favors named constants over dynamic
  strings for the non-parameterized cases.

## Decision: Frontend scope

**Decision**: No frontend changes in this plan.

**Rationale**: Confirmed via repo search that `src/ui/apps/web/lib/api/follow.ts` (`createFollowApi`)
has zero call sites anywhere under `src/ui/apps/web/app` or `src/ui/apps/web/components` — there is
currently no "Follow" button or follow-status UI in the product at all (Follow, unlike Connections,
was built backend-first with no consuming UI yet). Spec FR-010 ("avoid presenting Follow where
disallowed") has nothing to change today; it will apply automatically once a Follow UI is built,
provided that future UI calls `GET /follow/status` or checks role before rendering, which is a
concern for whichever spec introduces that UI, not this one.

**Alternatives considered**:
- *Build a minimal Follow button now to also demonstrate FR-010*: rejected as scope creep — the
  user's request was to restrict the existing Follow capability, not to build new UI; introducing
  a UI surface here would violate Constitution Principle IV (minimal, convention-matching diffs)
  and go beyond the spec's stated input.
