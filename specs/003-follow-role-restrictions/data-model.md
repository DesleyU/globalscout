# Phase 1 Data Model: Follow Role Restrictions

No new entities, tables, or migrations. This feature adds a business-rule check evaluated against
existing data.

## Existing Entities Used (unchanged)

### `Follow` (`GlobalScout.Domain.Social.Follow`)

Existing entity — no schema change. Referenced here only to confirm no new field is needed:

| Field | Type | Notes |
|---|---|---|
| `FollowerId` | `Guid` | Existing — the user doing the following |
| `FollowingId` | `Guid` | Existing — the user being followed |
| `CreatedAt` | `DateTimeOffset` | Existing |

### `UserRole` (`GlobalScout.Domain.Identity.UserRole`)

Existing enum — no change: `Player = 0`, `Club = 1`, `ScoutAgent = 2`, `Admin = 3`, `Pending = 4`.

## New Logic Unit (not a persisted entity)

### `FollowEligibility` (`GlobalScout.Application.Social.Follow`)

A pure, stateless rule evaluator — not a domain entity, no persistence. Conceptually:

| Follower Role | Target Role | Allowed? |
|---|---|---|
| `Player` | `Player` | Yes |
| `Player` | `ScoutAgent` | No |
| `Player` | `Club` | No |
| `Player` | `Admin` | No |
| `Player` | `Pending` | No |
| `ScoutAgent` | `Player` | Yes |
| `ScoutAgent` | `ScoutAgent` | No |
| `ScoutAgent` | `Club` | No |
| `ScoutAgent` | `Admin` | No |
| `ScoutAgent` | `Pending` | No |
| `Club` | (any) | No — Clubs are not a follow-graph participant on either side in this iteration |
| `Admin` | (any) | No — Admins are not a follow-graph participant on either side |
| `Pending` | (any) | No — Pending accounts are not fully-established participants |
| (any) | `Club` | No |
| (any) | `Admin` | No |
| (any) | `Pending` | No |

This table is exhaustive over `UserRole × UserRole` (5 × 5 = 25 pairings; 2 allowed, 23 rejected)
and is the basis for `FollowEligibilityTests.cs`'s parameterized test cases (Phase 2 / tasks).

## Validation Rules

- Eligibility is evaluated using the **current, live role** of both users at the moment of the
  follow attempt (not a cached/claims-based role) — see research.md, "Where does role come from."
- Eligibility is evaluated only on **create**. `UnfollowUserCommandHandler` performs no eligibility
  check — an existing follow (however it originated) can always be removed.
- No retroactive validation or cleanup of existing `Follow` rows is performed by this feature
  (FR-008); a pairing that becomes disallowed does not affect rows already in the table.

## State Transitions

None beyond what already exists (`Follow` row created / deleted). This feature only gates entry
into the "created" state; no new states are introduced.
