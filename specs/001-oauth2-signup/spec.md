# Feature Specification: OAuth2 Social Sign-Up

**Feature Branch**: `001-oauth2-signup`

**Created**: 2026-09-09

**Status**: Draft

**Input**: User description: "new users now have to create an account within the platform. we need to support OAuth2 providers like Google, Facebook, Apple, etc. The basic information like email, name and age should be retrieved if possible. any information that is required now for a basic player profile should be obtained at a later step."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sign up with a social provider (Priority: P1)

A new visitor arrives at GlobalScout and chooses to create an account using an existing account with a supported identity provider (Google, Facebook, or Apple) instead of filling out a registration form by hand. The provider handles login and consent, and GlobalScout creates a new account pre-filled with whatever basic details the provider is willing to share.

**Why this priority**: This is the core capability being requested — without it, nothing else in this feature exists. It is also the fastest path to a new, verified account and directly reduces sign-up friction, which is the primary business motivation.

**Independent Test**: Can be fully tested by starting sign-up, choosing a provider, completing that provider's consent screen with a test/sandbox account, and confirming a new GlobalScout account is created and the person is signed in — without touching any later profile-completion step.

**Acceptance Scenarios**:

1. **Given** a visitor with no existing GlobalScout account, **When** they choose "Continue with Google" (or Facebook, or Apple) and approve the provider's consent prompt, **Then** GlobalScout creates a new account, signs them in, and stores the email, name, and age/birthdate the provider returned.
2. **Given** a visitor who cancels or denies consent on the provider's screen, **When** they are returned to GlobalScout, **Then** no account is created and they see a clear message that sign-up was not completed, with the option to try again or choose a different method.
3. **Given** a visitor completes sign-up with a provider, **When** the provider does not return one or more of email, name, or age, **Then** the account is still created successfully using whatever fields were returned, without error.

---

### User Story 2 - Complete required player-profile details after sign-up (Priority: P2)

Immediately after a new account is created via a social provider, the person is guided into a short follow-up step to supply the information a basic player profile requires that the provider did not (or could not) supply — before they can access the rest of the platform as a player.

**Why this priority**: Depends on User Story 1 (an account must exist first), but delivers the actual business value: a usable player profile, not just an authenticated identity. It is second priority because sign-up itself is testable and demonstrable without it, but the platform is not genuinely useful until this step exists.

**Independent Test**: Can be tested independently by seeding an account that is missing required player-profile fields and confirming the person is routed to a completion step that collects exactly the missing required fields, and cannot be skipped, before reaching the main product experience.

**Acceptance Scenarios**:

1. **Given** a newly created account missing one or more fields required for a basic player profile, **When** the person finishes the sign-up redirect, **Then** they are presented with a form asking only for the missing required fields (not fields already supplied by the provider).
2. **Given** a person on the profile-completion step, **When** they submit valid values for all required fields, **Then** their basic player profile is marked complete and they are taken into the main platform experience.
3. **Given** a person on the profile-completion step, **When** they attempt to navigate away or close the flow without submitting required fields, **Then** they remain unable to access the main platform experience until the required fields are completed on a subsequent visit.

---

### User Story 3 - Sign in again with the same social provider (Priority: P3)

A returning user who originally signed up with a social provider comes back to GlobalScout and signs in again using the same provider, landing back in their existing account rather than a new one.

**Why this priority**: Necessary for the feature to be usable beyond a single session, but it is a natural consequence of correctly implemented sign-up (User Story 1) rather than new sign-up behavior, so it can trail in priority.

**Independent Test**: Can be tested independently by completing sign-up once with a test provider account, signing out, and signing in again with the same provider account, confirming the same GlobalScout account (same identity, same profile state) is returned rather than a duplicate.

**Acceptance Scenarios**:

1. **Given** a person who previously signed up with Google, **When** they return later and choose "Continue with Google" using the same Google account, **Then** they are signed into their existing GlobalScout account with all previously saved data intact.
2. **Given** a returning user whose basic player profile was left incomplete after their first sign-up, **When** they sign in again, **Then** they are routed back to the profile-completion step rather than the main platform experience.

---

### Edge Cases

- What happens when a person chooses a social provider but that provider is temporarily unreachable or returns an error? System must show a clear failure message and allow retry without creating a partial account.
- How does the system behave when the same person tries two different providers (e.g., signs up with Google, later tries "Continue with Facebook") using accounts that share the same email address? Per FR-010, the two identities are auto-linked into one account if the email is provider-verified; otherwise the person is directed to sign in with their original method.
- What happens if a provider returns an age/birthdate that indicates the person is below the platform's minimum age? Per FR-011, account creation is blocked for anyone under 16.
- What happens if a provider's consent screen returns an email the platform cannot verify as confirmed/verified by the provider?
- How does the system handle a person who starts the profile-completion step, abandons it, and returns days later — is partially entered data preserved?
- What happens if a person already has a GlobalScout account (created via existing email/password registration) and attempts to sign up again via a social provider with the same email?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow a new visitor to create a GlobalScout account by authenticating through a supported third-party identity provider using the OAuth2 authorization flow.
- **FR-002**: System MUST support, at minimum, Google, Facebook, and Apple as identity providers at launch, and MUST be structured so additional providers can be added without redesigning the sign-up flow.
- **FR-003**: System MUST request, at minimum, email address, full name, and age (or date of birth) from the identity provider during the consent flow, when the provider is capable of supplying them.
- **FR-004**: System MUST successfully create an account even when the provider does not return one or more of email, name, or age, and MUST NOT block account creation solely because optional provider fields are missing.
- **FR-005**: System MUST NOT ask the person to re-enter, during sign-up itself, any basic information (email, name, age) that the provider already supplied.
- **FR-006**: System MUST identify which fields are still required for a basic player profile but were not supplied by the provider, and MUST collect exactly those missing fields in a separate, later step rather than during initial sign-up.
- **FR-007**: System MUST prevent a person from accessing the main platform experience as a player until all fields required for a basic player profile have been collected.
- **FR-008**: System MUST persist partially completed profile data across sessions, so a person who abandons the profile-completion step can resume later without re-entering already-provided information.
- **FR-009**: System MUST recognize a returning person who signs in again with the same identity provider and account, and MUST sign them into their existing GlobalScout account rather than creating a duplicate.
- **FR-010**: System MUST, when a person authenticates via a social provider using an email address the provider has confirmed as verified, and that email matches an existing GlobalScout account (created via password registration or a different social provider), automatically link the new provider to that existing account and sign the person into it — without creating a duplicate account or requiring an extra confirmation step. If the provider does not confirm the email as verified, the system MUST NOT auto-link, and MUST instead direct the person to sign in with their original method.
- **FR-011**: System MUST enforce a minimum age of 16 for account creation. If the age or date of birth supplied by the provider (or, absent that, self-reported during profile completion) indicates the person is under 16, the system MUST block account creation and show a clear explanation, without creating an account.
- **FR-012**: System MUST display a clear, actionable error and allow retry, without leaving a partially created account, when the OAuth2 flow fails, times out, or the person denies consent.
- **FR-013**: System MUST allow account creation for any GlobalScout account type (player, club, scout, or agent) via the same OAuth2 providers, routing only player accounts into the basic-player-profile completion step described in User Story 2.
- **FR-014**: System MUST log authentication and account-creation events for the OAuth2 flow for security auditing purposes, consistent with existing authentication logging practice.

### Key Entities

- **User Account**: Represents a person's identity on GlobalScout. Key attributes: unique identifier, email address, whether that email is provider-verified, display/full name, age or date of birth, account type (player/club/scout/agent), verification/completion status of required profile data, timestamps for creation and last sign-in.
- **Linked Identity Provider**: Represents the association between a User Account and one external identity provider used to authenticate. Key attributes: provider name (Google/Facebook/Apple/etc.), provider-issued identity reference, date linked.
- **Basic Player Profile**: The minimum set of information required for a player-type account to be usable on the platform beyond authentication. Key attributes: the specific required fields not already covered by email/name/age, and a completion status flag.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user can go from choosing "sign up" to having an authenticated GlobalScout account in under 60 seconds when using a social provider, excluding time spent on the provider's own consent screen.
- **SC-002**: At least 95% of sign-up attempts that complete the provider's consent screen result in a successfully created GlobalScout account (no lost or corrupted sign-ups due to platform-side errors).
- **SC-003**: 100% of new player accounts created via a social provider are correctly routed to complete only the specific basic-player-profile fields the provider did not supply — no user is asked to re-enter data already provided.
- **SC-004**: Returning users who previously signed up with a given provider are matched to their existing account on 100% of subsequent sign-ins with that same provider, with zero duplicate accounts created.
- **SC-005**: Support tickets or reported confusion related to account creation/sign-up decrease measurably (target: 50% reduction) within the first full reporting period after launch, compared to the prior email/password-only flow.

## Assumptions

- Existing email/password registration remains available alongside the new OAuth2 sign-up options; this feature adds a path, it does not remove the existing one.
- "Basic player profile" refers to whatever fields are already required today for a player account to be considered complete/usable on the platform, minus whatever email/name/age already cover; this feature does not redefine that required field set.
- Non-player account types (club, scout, agent) can be created through the same OAuth2 flow, but defining their own later completion steps is out of scope for this feature — only the player follow-up (User Story 2) is in scope.
- "Age" may be supplied by a provider either as an exact date of birth or a computed age; either satisfies the intent of this feature, since providers vary in what they expose.
- Session and token handling for the OAuth2 flow follows the platform's existing authentication session model; this feature does not introduce a new session mechanism.
- Providers beyond Google, Facebook, and Apple ("etc.") are a future extension, not required for this feature's initial scope.
