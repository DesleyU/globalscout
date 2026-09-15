# Feature Specification: Follow Role Restrictions

**Feature Branch**: `003-follow-role-restrictions`

**Created**: 2026-09-15

**Status**: Draft

**Input**: User description: "Restrict who can follow whom on the social graph. Currently FollowUserCommandHandler allows any user to follow any other user regardless of role. Change this so that: Players can follow other Players. Agents (the ScoutAgent role) can follow Players. Players cannot follow Agents or Clubs. Agents cannot follow other Agents. Admins are not part of the follow graph. Attempting a disallowed follow should return a clear domain error, not a generic failure. This does not change the existing Connections (connect/accept) feature, which remains open between any roles for now -- this spec is scoped only to the Follow feature."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Player follows another Player (Priority: P1)

A Player browsing another Player's profile wants to follow them to see their activity and updates, without requiring mutual approval.

**Why this priority**: This is the primary, highest-volume use of Follow today and must keep working exactly as-is — it's the baseline the restriction must not break.

**Independent Test**: Can be fully tested by having a Player follow another Player and confirming the follow succeeds and appears in both the follower's "following" list and the target's "followers" list.

**Acceptance Scenarios**:

1. **Given** a Player viewing another Player's profile, **When** they choose to follow that Player, **Then** the follow succeeds immediately and is reflected in both users' follow lists.
2. **Given** a Player already following another Player, **When** they choose to unfollow, **Then** the follow relationship is removed for both users.

---

### User Story 2 - Agent follows a Player (Priority: P1)

An Agent (ScoutAgent role) wants to follow a Player to track that player's activity and updates as part of scouting/representation work.

**Why this priority**: This is a core cross-role use case central to the platform's purpose (agents/scouts tracking players) and must be explicitly supported, not just tolerated.

**Independent Test**: Can be fully tested by having an Agent follow a Player and confirming the follow succeeds and appears in both parties' follow lists.

**Acceptance Scenarios**:

1. **Given** an Agent viewing a Player's profile, **When** they choose to follow that Player, **Then** the follow succeeds immediately.

---

### User Story 3 - Disallowed follow attempts are clearly rejected (Priority: P1)

A user attempts to follow another user whose role is not permitted for them to follow (e.g. a Player trying to follow an Agent or a Club; an Agent trying to follow another Agent), and receives a clear explanation of why it isn't allowed instead of a generic error.

**Why this priority**: Without a clear, specific rejection, users and support staff cannot distinguish "not allowed by policy" from "something broke," which erodes trust and generates avoidable support load. This is equally critical to shipping the restriction correctly.

**Independent Test**: Can be fully tested by attempting each disallowed role pairing (Player→Agent, Player→Club, Agent→Agent, anyone→Admin, Admin→anyone) and confirming each is rejected with a specific, role-aware message rather than a generic failure.

**Acceptance Scenarios**:

1. **Given** a Player viewing an Agent's or Club's profile, **When** they attempt to follow, **Then** the system rejects the action and explains that Players can only follow other Players.
2. **Given** an Agent viewing another Agent's profile, **When** they attempt to follow, **Then** the system rejects the action and explains that Agents can only follow Players.
3. **Given** any user, **When** they attempt to follow an Admin, or an Admin attempts to follow anyone, **Then** the system rejects the action, since Admins do not participate in the follow graph.
4. **Given** a Player or Agent who already follows a target, **When** the follow-eligibility rules change such that the pairing is no longer allowed for *new* follows, **Then** any pre-existing follow relationship is left untouched (this feature does not retroactively remove existing follows).

---

### User Story 4 - Follow affordances only appear where allowed (Priority: P2)

A user browsing profiles or search results should not be shown a "Follow" action on profiles they are not permitted to follow, so they aren't invited into an action that will just be rejected.

**Why this priority**: Improves clarity and reduces friction, but the system is still correct and safe without it (User Story 3's server-side rejection is the actual guarantee) — this is a UX polish layer on top.

**Independent Test**: Can be tested by viewing profiles/search results as each role and confirming the Follow control is present only for permitted target roles and absent (or replaced with an explanation) for disallowed ones.

**Acceptance Scenarios**:

1. **Given** a Player viewing an Agent's or Club's profile, **When** the profile renders, **Then** no "Follow" action is offered for that profile.
2. **Given** an Agent viewing another Agent's profile, **When** the profile renders, **Then** no "Follow" action is offered for that profile.

---

### Edge Cases

- What happens when a user's role changes (e.g. a Pending user completes onboarding and becomes a Player, or an account is reassigned to a different role) after they already follow someone under old eligibility? Existing follow relationships are preserved; only new follow attempts are evaluated against current-role rules.
- How does the system handle a follow attempt where the *follower's own* role is not yet fully established (e.g. still `Pending`)? Pending users are not part of the follow graph and any follow attempt is rejected.
- What happens if a Club account (which cannot be followed or follow anyone) is targeted directly via a stale link/bookmark to a stored profile? The follow attempt is rejected with the same clear domain error, regardless of how the target was reached.
- Unfollowing is unaffected by these rules: a user can always unfollow someone they currently follow, even if that pairing would no longer be allowed as a *new* follow today.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow a user with the Player role to follow another user with the Player role.
- **FR-002**: System MUST allow a user with the Agent (ScoutAgent) role to follow a user with the Player role.
- **FR-003**: System MUST prevent a Player from following a user with the Agent or Club role.
- **FR-004**: System MUST prevent an Agent from following another user with the Agent role.
- **FR-005**: System MUST prevent any user from following, or being followed by, a user with the Admin role.
- **FR-006**: System MUST reject a disallowed follow attempt with a specific, role-aware explanation distinguishing it from a generic/unexpected failure.
- **FR-007**: System MUST continue to leave the existing Connections (send/accept a connection request) feature open between any two roles; these follow restrictions apply only to Follow, not to Connections.
- **FR-008**: System MUST NOT retroactively remove or alter follow relationships that were created before this restriction takes effect, even if they would no longer be permitted as new follows.
- **FR-009**: System MUST continue to allow unfollowing any currently-followed user regardless of the follow-eligibility rules.
- **FR-010**: System SHOULD avoid presenting a "Follow" action to a user for profiles they are not permitted to follow.

### Key Entities

- **Follow**: An existing directional relationship between a follower user and a followed user. No new attributes are introduced; this feature adds an eligibility check evaluated at creation time based on the follower's and target's roles.
- **User Role**: The existing classification of an account (Player, Club, Agent/ScoutAgent, Admin) that this feature uses to determine follow eligibility. No changes to the role model itself.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of follow attempts between a permitted role pairing (Player→Player, Agent→Player) succeed under the same conditions that succeeded before this change.
- **SC-002**: 100% of follow attempts between a disallowed role pairing are rejected, and the rejection reason is specific enough that a user or support agent can identify which rule was violated without inspecting logs.
- **SC-003**: Zero pre-existing follow relationships are altered or removed as a side effect of shipping this feature.
- **SC-004**: Users report no confusion between "follow not allowed" and "something went wrong" in post-release support/feedback channels.

## Assumptions

- "Agents" in the user description refers to the existing `ScoutAgent` role, which is the single merged role covering both agents and scouts in this system today; no new role is introduced.
- Clubs and Admins are excluded from the follow graph entirely for this iteration: Clubs cannot be followed (per the description) and are assumed not to follow others either, since Clubs currently have no follow/connections UI at all; Admins are excluded on both sides as they are not participants in the social graph.
- This feature does not address the existing Connections feature, which remains role-agnostic; a future spec may revisit Connections role rules separately.
- The `Pending` role (pre-onboarding accounts) is treated as ineligible to follow or be followed, consistent with it not being a fully-established participant role elsewhere in the system.
- No retroactive cleanup of existing follow rows is performed; this is a forward-looking eligibility gate on new follow creation only.
