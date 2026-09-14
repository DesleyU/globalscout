# Feature Specification: Email Verification for Password Accounts

**Feature Branch**: `002-email-verification`

**Created**: 2026-09-13

**Status**: Draft

**Input**: User description: "the classic email+password users create their account with an email that is not verified at the moment. the app autmatically considers the password as verified. external provider users that use OAuth2 also have their email as auto-verified but that is by design because we trust providers like Google and Meta to verify their emails. We need to introduce a new step for internal(\"password in the database\") users so that we can verify their email address by sending them an email with a link to click on. the link has to be unique and expire after a certain amount of time."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Verify email address after creating a password account (Priority: P1)

A new visitor creates a GlobalScout account using an email address and password (not a social provider). GlobalScout does not yet know whether that person actually controls the email address they typed in, so it sends them an email containing a unique, one-time link. When they click that link, GlobalScout marks their email address as verified.

**Why this priority**: This is the core capability being requested. Without it, internal accounts continue to be treated as verified on nothing more than the person's own claim, which is the exact trust gap this feature closes. Every other behavior in this feature (resending, expiry, gating) only matters once this baseline flow exists.

**Independent Test**: Can be fully tested by registering a new account with email and password, confirming the account starts unverified, receiving the verification email, clicking the link, and confirming the account is now marked verified.

**Acceptance Scenarios**:

1. **Given** a visitor with no existing account, **When** they register using an email address and password, **Then** the account is created with its email marked unverified, and a verification email containing a unique link is sent to the address they provided.
2. **Given** a newly registered internal account with an unverified email, **When** the person opens the verification email and clicks the link before it expires, **Then** the account's email is marked verified and they see confirmation that verification succeeded.
3. **Given** a person who clicks a verification link a second time after already verifying, **When** the link is opened again, **Then** the system tells them the email is already verified without treating it as an error.

---

### User Story 2 - Request a new verification link (Priority: P2)

A person with an unverified internal account did not receive the original verification email, lost it, or let it expire before clicking it. They ask GlobalScout to send a new one.

**Why this priority**: Depends on User Story 1 (a verification flow must exist first), but is necessary for the feature to be usable in practice — email delivery is unreliable and links are time-limited by design, so people will routinely need a fresh link.

**Independent Test**: Can be tested independently by taking an account with an unverified email, requesting a new verification email, and confirming a new unique link is sent and that the new link successfully verifies the account while the old link no longer does.

**Acceptance Scenarios**:

1. **Given** a person with an unverified internal account, **When** they request the verification email be resent, **Then** a new verification email with a new unique link is sent to their account's email address.
2. **Given** a person requests a new verification link, **When** they then click the previously issued (older) link, **Then** the older link no longer verifies the account.
3. **Given** a person whose account is already verified, **When** they attempt to request a verification email, **Then** the system tells them their email is already verified instead of sending another link.

---

### User Story 3 - Expired or invalid verification links are rejected (Priority: P3)

A person clicks a verification link after too much time has passed, or clicks a link that is malformed, unrecognized, or was already fully consumed by an earlier click. GlobalScout must not verify the email in these cases, and must give the person a clear way to recover.

**Why this priority**: This is a safety/correctness boundary around the core flow (User Story 1) rather than a new capability on its own — it matters for security and trustworthiness, but the platform is minimally usable without it being perfectly handled on day one.

**Independent Test**: Can be tested independently by generating a verification link, letting it expire (or invalidating/reusing it), clicking it, and confirming the email is not marked verified and the person is offered a way to request a new link.

**Acceptance Scenarios**:

1. **Given** a verification link older than the expiry window, **When** the person clicks it, **Then** the account's email remains unverified, they see a message that the link expired, and they are offered a way to request a new one.
2. **Given** a verification link that does not match any pending verification request (invalid, tampered, or already fully consumed), **When** it is opened, **Then** the account's email remains unverified and the person sees a generic "link is invalid" message that does not reveal whether the account exists.

---

### Edge Cases

- What happens when a person changes the email address on an unverified internal account before clicking the original link? (The pending link should stop working and a new one should apply to the new address, not the old one.)
- What happens when a person requests a new verification email repeatedly in a short period of time? (System should throttle repeated requests to prevent abuse, rather than sending unlimited emails.)
- What happens when the verification email cannot be delivered (bounces, invalid address, spam-filtered)? The account remains unverified indefinitely until the person successfully requests and clicks a working link.
- What happens if two verification links are outstanding at once (an old one not yet expired, plus a freshly requested one)? Only the most recently issued link should be able to verify the account; earlier ones become invalid.
- OAuth2 (social provider) accounts are unaffected by this feature — their existing auto-verification behavior (trusting the provider's assertion) continues unchanged and is out of scope here.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST mark the email address of a newly created internal (email + password) account as unverified at the moment the account is created.
- **FR-002**: System MUST send an email to the address provided at registration, containing a unique verification link, immediately after an internal account is created.
- **FR-003**: Each verification link MUST be unique per verification request and MUST NOT be guessable or reusable across accounts.
- **FR-004**: Each verification link MUST expire 24 hours after it is issued, after which clicking it MUST NOT verify the email.
- **FR-005**: Clicking a valid, unexpired, not-yet-used verification link MUST mark the associated account's email as verified and MUST NOT be usable again afterward (single use).
- **FR-006**: System MUST allow a person with an unverified internal account to request that a new verification email be sent to them.
- **FR-007**: When a new verification link is issued for an account, any previously issued, still-outstanding link for that same account MUST become invalid.
- **FR-008**: System MUST reject verification attempts using an expired, already-used, or unrecognized link without revealing whether a matching account exists.
- **FR-009**: System MUST NOT send a verification email or issue a new link for an account whose email is already verified; a request to do so MUST inform the person their email is already verified.
- **FR-010**: System MUST throttle repeated verification-email requests for the same account within a short time window to prevent abuse.
- **FR-011**: Social-provider (OAuth2) accounts MUST continue to follow their existing verification behavior unchanged; this feature applies only to internal (password) accounts.
- **FR-012**: If a person with an unverified internal account changes their account's email address, System MUST invalidate any outstanding verification link and require verification of the new address.
- **FR-013**: System MUST make the verification status of an internal account (verified / unverified) visible to the person so they know whether action is still required.

### Key Entities

- **Email Verification Request**: Represents one outstanding invitation to verify a specific account's email address. Carries the target account, the email address being verified, a unique unrecognizable link/token, when it was issued, when it expires, and whether it has already been used. Superseded by a newer request for the same account.
- **Internal Account (password-based user)**: An existing account type that authenticates with an email and password. Gains an explicit email-verification status (verified / unverified) that starts unverified at creation and becomes verified only through this feature's flow — distinct from social-provider accounts, whose verification is trusted from the provider at sign-up.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A person who registers a new internal account receives their verification email within 2 minutes of completing registration.
- **SC-002**: Clicking a valid, unexpired verification link successfully verifies the account's email on the first attempt, with no manual support intervention required.
- **SC-003**: An expired, reused, or invalid verification link never results in an account being marked verified.
- **SC-004**: A person who lost or let their original link expire can obtain a working replacement and complete verification in under 2 minutes from requesting it.
- **SC-005**: At least 60% of newly created internal accounts complete email verification within 24 hours of registering.

## Assumptions

- Verification links expire 24 hours after issuance (confirmed default, see FR-004).
- Whether unverified accounts are blocked from using the platform (full gating) versus allowed in with a persistent reminder is a product decision to be settled during planning; this spec defines the verification mechanism itself and treats access-gating as a follow-on decision, not a blocker to specifying this feature.
- Existing internal accounts created before this feature ships are already marked verified under current behavior; this spec does not require retroactively un-verifying them.
- Verification emails are sent to the single email address on file for the account; multi-email-per-account is out of scope.
- Standard transactional-email delivery (not SMS or in-app-only) is the assumed channel, consistent with "sending them an email with a link" in the request.
