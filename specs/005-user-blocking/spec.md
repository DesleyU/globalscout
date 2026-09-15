# Feature Specification: User Blocking

**Feature Branch**: `005-user-blocking`

**Created**: 2026-09-15

**Status**: Draft

**Input**: User description: "Build block as it's supposed to work. A UserBlock domain entity and database table already exist, but today they're only touched by admin account-deletion cleanup -- there's no way for a user to block someone themselves, and neither Connections nor Messages check it. Make blocking a real, user-facing feature: users can block/unblock another user, and once blocked, the two users cannot connect, follow, or message each other."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Block a user (Priority: P1)

A user experiencing unwanted contact (spam connection requests, harassing messages, etc.) blocks the other user from their profile or an existing conversation, immediately stopping further contact.

**Why this priority**: This is the entire point of the feature — without the ability to block, none of the protective value exists. It's also a trust-and-safety capability, which makes it a P1 regardless of usage volume.

**Independent Test**: Can be fully tested by having User A block User B from User B's profile, and confirming the block is recorded and takes effect immediately.

**Acceptance Scenarios**:

1. **Given** User A is viewing User B's profile or a conversation with User B, **When** User A chooses to block User B, **Then** the block takes effect immediately and User A sees confirmation.
2. **Given** User A has blocked User B, **When** User A views their block list, **Then** User B appears in it.

---

### User Story 2 - Blocking stops connections, follows, and messages both ways (Priority: P1)

Once User A blocks User B, neither user can send the other a connection request, follow the other, or send the other a message, and any existing connection or follow between them ends.

**Why this priority**: A block that only prevents new contact but leaves an existing connection, follow, or open conversation intact does not actually solve the problem the user is blocking for — this is the core guarantee the feature has to deliver.

**Independent Test**: Can be fully tested by establishing a connection, a follow, and a message thread between two users, having one block the other, and confirming the connection and follow are gone and further messages/requests from either side are rejected.

**Acceptance Scenarios**:

1. **Given** User A and User B have an accepted connection, **When** User A blocks User B, **Then** the connection is ended for both users.
2. **Given** User B follows User A (or User A follows User B), **When** User A blocks User B, **Then** the follow relationship is removed.
3. **Given** User A has blocked User B, **When** User B attempts to send User A a connection request, follow User A, or message User A, **Then** the attempt is rejected.
4. **Given** User A has blocked User B, **When** User A attempts to send User B a connection request, follow User B, or message User B, **Then** the attempt is also rejected (the restriction applies to both directions, regardless of who initiated the block).
5. **Given** User A has blocked User B, **When** User A had a pending (not-yet-accepted) connection request with User B in either direction, **Then** that pending request is cancelled as part of the block.

---

### User Story 3 - Unblock a user (Priority: P2)

A user changes their mind, or blocked someone by mistake, and removes the block from their block list, restoring the ability for normal contact to be initiated again.

**Why this priority**: Necessary for the feature to be safe and correct long-term (blocks shouldn't be permanent/irreversible without recourse), but the platform is still functional and safe without it in the short term since User Story 1-2 already deliver the protective value.

**Independent Test**: Can be fully tested by blocking a user, then unblocking them, and confirming a new connection request, follow, or message between the two can succeed again afterward.

**Acceptance Scenarios**:

1. **Given** User A has blocked User B, **When** User A unblocks User B, **Then** User B is removed from User A's block list.
2. **Given** User A has unblocked User B, **When** either user attempts to connect, follow, or message the other, **Then** the attempt is evaluated normally (no lingering restriction from the past block).
3. **Given** User A has unblocked User B, **When** the unblock completes, **Then** the connection and follow relationships that were ended at block time are not automatically restored — either user must re-initiate them.

---

### Edge Cases

- Does the blocked user find out they've been blocked? No — blocking is silent; the blocked user is not notified, and attempts to contact the blocker fail with a generic, non-specific outcome rather than an explicit "you have been blocked by this user" message.
- What happens to message history that already exists between the two users at the time of blocking? Prior message history is preserved (not deleted) for both users, but no new messages can be sent in either direction while the block is active.
- Can a user block someone they have no relationship with at all (no connection, no follow, never messaged)? Yes — blocking does not require a pre-existing relationship.
- Can a user block themselves? No, blocking oneself is not a meaningful action and must be rejected.
- What happens if User A blocks User B while User B is actively viewing User A's profile or mid-conversation? The next action User B attempts against User A (message, connect, follow, or reload) reflects the blocked state; no live/forced session interruption is required.
- Does an existing block affect whether a blocked user can still find the blocker in search results or view their profile? Yes — while blocked, neither party is discoverable to the other in search, and direct profile access is blocked for both.
- What happens to this feature's data when an admin deletes an account (existing cleanup behavior)? Existing admin account-deletion cleanup of block records continues to apply and is not changed by this feature.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to block another user from that user's profile or from an existing conversation with them.
- **FR-002**: Users MUST be able to view a list of everyone they currently have blocked.
- **FR-003**: Users MUST be able to unblock a previously blocked user.
- **FR-004**: System MUST prevent a user from blocking themselves.
- **FR-005**: When a block is created, System MUST end any existing accepted connection between the two users.
- **FR-006**: When a block is created, System MUST remove any existing follow relationship between the two users, in either direction.
- **FR-007**: When a block is created, System MUST cancel any pending connection request between the two users, in either direction.
- **FR-008**: While a block is active, System MUST prevent either user from sending the other a new connection request.
- **FR-009**: While a block is active, System MUST prevent either user from following the other.
- **FR-010**: While a block is active, System MUST prevent either user from sending the other a new message.
- **FR-011**: While a block is active, System MUST prevent either user from appearing in the other's user search results or being able to directly view the other's profile.
- **FR-012**: System MUST NOT notify the blocked user that they have been blocked, and MUST NOT reveal block status through error messages exposed to the blocked user.
- **FR-013**: System MUST preserve existing message history between the two users at the time of blocking (no deletion of past messages).
- **FR-014**: When a block is removed (unblocked), System MUST NOT automatically restore the connection or follow relationships that were ended when the block was created.
- **FR-015**: Existing admin account-deletion cleanup behavior involving block records MUST continue to function unchanged.

### Key Entities

- **User Block**: An existing entity representing that one user has blocked another, with a record of who blocked whom and when. This feature adds user-facing creation/removal of these records and enforcement of their effect across Connections, Follow, Messages, and Search/profile visibility — no new attributes are assumed to be required beyond what already exists, unless implementation reveals a gap (e.g. a reason/note field), which is a planning-time decision.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of connection, follow, and message attempts between two users where either has blocked the other are prevented, in both directions.
- **SC-002**: An existing connection or follow between two users is fully removed within the same action that creates a block between them (no delay, no separate manual step required).
- **SC-003**: A user can locate and block a problematic user in 2 actions or fewer from that user's profile or an open conversation.
- **SC-004**: Zero instances of a blocked user being able to determine, through the product's behavior or messaging, that they have specifically been blocked (as opposed to some other failure).
- **SC-005**: A user can review and fully manage (view and unblock) everyone they've blocked from a single place.

## Assumptions

- Blocking is mutual in effect even though initiated by one party: once a block exists between two users, neither can contact the other, regardless of who created the block — this matches common platform conventions and the "cannot connect, follow, or message each other" framing in the request.
- Blocking does not require an existing relationship (connection/follow/conversation) to be present first.
- No "report" or moderation-escalation workflow is included in this feature — this spec is scoped to the block/unblock mechanic and its enforcement, not to abuse reporting or admin review of blocks.
- A blocked/blocking pair remains invisible to each other in search and direct profile access, consistent with standard blocking behavior on comparable platforms, even though the original request only explicitly named connections, follows, and messages.
- Message history is retained (not purged) when a block is created, since deleting history is a distinct, higher-risk action the request did not ask for.
