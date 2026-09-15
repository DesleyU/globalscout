# Feature Specification: Real-Time Notifications

**Feature Branch**: `004-realtime-notifications`

**Created**: 2026-09-15

**Status**: Draft

**Input**: User description: "Build real-time notifications with SignalR. Currently the only real-time channel is chat messages; new connection requests, accepted connections, and new followers are pull-only (refresh to see them), and the notification bell in the header is decorative (hardcoded badge count, no panel, no backend). Build a real notification center backed by a persisted domain, pushed live over SignalR, covering connection-request and follow activity."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Notified live when someone sends a connection request (Priority: P1)

A user who is currently active on the platform receives a live alert the moment another user sends them a connection request, without needing to refresh or navigate to the pending-requests page.

**Why this priority**: Connection requests are the highest-value social action on the platform; missing them (or only discovering them by chance) directly undermines the point of the feature.

**Independent Test**: Can be fully tested by having User A send a connection request to User B while User B is active in the app, and confirming User B sees a notification appear without reloading the page.

**Acceptance Scenarios**:

1. **Given** User B is active in the app, **When** User A sends User B a connection request, **Then** User B sees a live notification within seconds, and the header's unread indicator updates.
2. **Given** User B is not currently active (offline/not connected), **When** User A sends User B a connection request, **Then** the notification is waiting for User B in their notification center the next time they open the app.

---

### User Story 2 - Notified when a connection request is accepted (Priority: P1)

A user who sent a connection request is notified, live if active, when the recipient accepts it.

**Why this priority**: Closing the loop on a sent request is core to the connection flow and equally important as the initial request alert — without it, the sender has no way to know their request succeeded short of manually checking.

**Independent Test**: Can be fully tested by having User A send a request to User B, User B accepts it, and confirming User A receives a notification.

**Acceptance Scenarios**:

1. **Given** User A has a pending connection request to User B, **When** User B accepts it, **Then** User A sees a live notification (if active) or finds it in their notification center on next visit.

---

### User Story 3 - Notified about new followers (Priority: P2)

A user is notified when another eligible user starts following them.

**Why this priority**: Valuable engagement signal, but lower stakes than connection requests/acceptances — a missed or delayed follow notification doesn't block any workflow the way a missed connection request could.

**Independent Test**: Can be fully tested by having User A follow User B and confirming User B receives a notification.

**Acceptance Scenarios**:

1. **Given** User B is active in the app, **When** User A follows User B, **Then** User B sees a live notification within seconds.

---

### User Story 4 - Browse and manage a notification history (Priority: P1)

A user opens the notification center (the header bell) to see a chronological list of their recent notifications, distinguishing read from unread, and can mark them as read.

**Why this priority**: Live push alone isn't enough — users are frequently not looking at the screen the instant something happens, so a durable, reviewable history is what makes the feature actually useful, and it's the foundation the other stories render into.

**Independent Test**: Can be fully tested by generating a few notifications for a user, opening the notification panel, and confirming they appear in order with correct read/unread state, and that opening/clicking one marks it read.

**Acceptance Scenarios**:

1. **Given** a user has unread notifications, **When** they open the notification panel, **Then** they see each notification with enough context to understand what happened and when.
2. **Given** a user has unread notifications, **When** they open or click a notification, **Then** it is marked read and the unread count decreases accordingly.
3. **Given** a user has no notifications, **When** they open the notification panel, **Then** they see a clear empty state rather than a blank or broken panel.
4. **Given** a user has read all their notifications, **When** they look at the header bell, **Then** it shows no unread badge (not a stale or hardcoded count).

---

### Edge Cases

- What happens when a user has the app open in multiple tabs or devices simultaneously? All active sessions for that user receive the live push, and read state is consistent across them (marking read in one place reflects everywhere).
- What happens when the same pair of users repeatedly triggers the same type of event (e.g. rapid follow/unfollow/follow)? The system should avoid flooding the user with redundant notifications for the same underlying relationship state change.
- What happens to a notification whose underlying object is later reversed (e.g. a connection request is withdrawn before being viewed, or a follow is immediately undone)? The notification still records that the event occurred; it is not silently deleted, but its deep link degrades gracefully if the target state no longer exists.
- What happens when a connection request or follow is disallowed by role rules and therefore never actually happens? No notification is generated, since no underlying event occurred.
- How far back does notification history go, and is there a limit? Older notifications remain accessible but the default view surfaces the most recent first; unbounded retention/pagination behavior is an implementation decision, not a user-facing requirement here.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST create a persisted notification for the recipient when a user receives a new connection request.
- **FR-002**: System MUST create a persisted notification for the original sender when their connection request is accepted.
- **FR-003**: System MUST create a persisted notification for a user when they gain a new follower.
- **FR-004**: System MUST push newly created notifications live to any of the recipient's currently active sessions, without requiring a page refresh.
- **FR-005**: System MUST make notifications durable so a user who was not active when an event occurred can still see it the next time they open the app.
- **FR-006**: Users MUST be able to view a chronological history of their notifications through a notification center.
- **FR-007**: Users MUST be able to mark notifications as read, individually or all at once, and the system MUST reflect an accurate unread count derived from real data (no hardcoded or stale values).
- **FR-008**: System MUST keep read/unread state consistent across all of a user's active sessions/devices.
- **FR-009**: Each notification MUST link to the relevant content (e.g. a connection-request notification leads to the pending requests view; a new-follower notification leads to the follower's profile).
- **FR-010**: System MUST NOT generate a notification for a connection or follow action that did not actually succeed (e.g. was rejected by eligibility rules).
- **FR-011**: System MUST avoid generating duplicate/redundant notifications for rapid repeated toggling of the same relationship between the same two users.

### Key Entities

- **Notification**: A record of a single event relevant to a specific recipient user — who it's for, what kind of event occurred (connection request received, connection accepted, new follower), a reference to the related entity (the connection or follow relationship, and the other user involved), when it was created, and whether it has been read.
- **Notification Type**: The category of event a notification represents; this spec covers connection-request-received, connection-accepted, and new-follower, with room for future types (e.g. new message) without requiring a redesign.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An active user sees a live notification for a new connection request, an accepted connection, or a new follower within 5 seconds of the event occurring.
- **SC-002**: 100% of connection-request, connection-accepted, and new-follower events that occur while a user is offline are visible in their notification center the next time they open the app.
- **SC-003**: The unread badge count matches the actual number of unread notifications 100% of the time, across page reloads and multiple open sessions.
- **SC-004**: Users can go from seeing a notification to viewing the relevant content (e.g. the pending request, the new follower's profile) in one click.
- **SC-005**: No user-reported instances of duplicate notifications for the same single event.

## Assumptions

- This spec covers connection-request-received, connection-accepted, and new-follower events only; chat messages already have their own real-time delivery path and are out of scope here (though the notification center's design should not preclude folding message alerts in later).
- Follow eligibility rules (which roles may follow which) are governed by a separate spec/feature; this spec only generates notifications for follow events that actually succeed under whatever rules are in effect.
- "Currently active" means the user has the app open with a live realtime connection; users without a live connection simply receive the notification as unread history on their next visit rather than a push.
- No push notifications to mobile devices, email, or other out-of-app channels are in scope; this is in-app only.
- A reasonable default retention/history window (e.g. most recent notifications with pagination) is acceptable; no specific retention period was requested.
