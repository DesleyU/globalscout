# Contract: `POST /api/follow/{userId}/follow`

Existing endpoint (`PostFollowFollow.cs`, route `FollowRoutes.FollowUser`). This feature changes
only its **failure** behavior for role-disallowed pairings; the request shape, auth requirement,
and success (200) response are unchanged.

## Request

- **Method / Path**: `POST /api/follow/{userId}/follow`
- **Auth**: Required (`RequireAuthorization()`); caller identity resolved from the bearer token via
  `HttpUser.ResolveId(user)` — this is the *follower*.
- **Path parameter**: `userId` (`Guid`) — the user to follow (the *target*).
- **Body**: none.

## Responses

### 200 OK — unchanged

Returned when the follow is created, i.e. the pair is role-eligible (Player→Player or
ScoutAgent→Player) **and** all existing checks pass (not self, target exists, not already
following).

```json
{
  "message": "Successfully followed user",
  "follow": {
    "id": "guid",
    "followingUser": { "id": "guid", "role": "PLAYER", "profile": { "...": "..." } },
    "createdAt": "2026-09-15T00:00:00Z"
  }
}
```

### 400 Bad Request — NEW behavior for disallowed role pairings

Returned instead of a 200 when the follower's role is not permitted to follow the target's role.
Shape matches the existing `Error.Problem` → `CustomResults.Problem` convention already used for
`Social.CannotFollowSelf` / `Social.AlreadyFollowing` on this same endpoint.

```json
{
  "type": "https://httpstatuses.com/400",
  "title": "Bad request",
  "status": 400,
  "detail": "Players can only follow other Players.",
  "code": "Social.FollowRestrictedToPlayers"
}
```

Possible `code` values introduced by this feature (exact final naming is an implementation detail
of `SocialErrors.cs`, decided during implementation to match existing naming conventions in that
file — this contract fixes the *behavior*, not the literal string):

| Scenario | HTTP Status | Error code (indicative) |
|---|---|---|
| Player attempts to follow a non-Player (Agent, Club, Admin, Pending) | 400 | `Social.FollowRestrictedToPlayers` |
| Agent attempts to follow a non-Player (Agent, Club, Admin, Pending) | 400 | `Social.AgentsCanOnlyFollowPlayers` |
| Anyone attempts to follow an Admin, or an Admin attempts to follow anyone | 400 | `Social.AdminNotInFollowGraph` |
| Club is the follower or the target (any pairing) | 400 | `Social.FollowRestrictedToPlayers` / `Social.AgentsCanOnlyFollowPlayers` per follower role, or a Club-specific code if clearer during implementation |

### Existing responses, unchanged by this feature

| Scenario | HTTP Status | Error code |
|---|---|---|
| Not authenticated | 401 | — |
| Following self | 400 | `Social.CannotFollowSelf` |
| Target user does not exist | 404 | `Social.UserNotFound` |
| Already following | 400 | `Social.AlreadyFollowing` |

## Ordering note

The role-eligibility check is evaluated after "not self" and "target exists" (both are cheap,
already-present guards this handler runs first) and before "already following" is re-verified via
`FollowExistsAsync`/`CreateFollowAsync` — see research.md for the rationale (match existing
handler guard-clause ordering; role-lookup is the newest and most expensive check, so it runs once
existence is confirmed, avoiding a wasted role lookup against a nonexistent target).

## `POST /api/follow/{userId}/unfollow` — unchanged, no contract change

Unfollow performs no eligibility check (FR-009); this contract is unaffected by this feature and is
listed only for completeness.
