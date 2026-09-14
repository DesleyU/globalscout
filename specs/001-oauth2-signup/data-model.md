# Data Model: OAuth2 Social Sign-Up

This feature extends existing entities rather than introducing a new persistence subsystem. No new tables beyond the one ASP.NET Core Identity already provisions (`AspNetUserLogins`) are required.

## Entities

### ApplicationUser (existing — `GlobalScout.Infrastructure.Identity.ApplicationUser`)

No schema change required. Fields already present that this feature relies on:

| Field | Type | Role in this feature |
|---|---|---|
| `Id` | `Guid` | Stable account identifier surfaced to the frontend and JWT `sub`. |
| `Email` / `NormalizedEmail` | `string` | Matched against a provider's returned email for the FR-010 linking decision. |
| `EmailConfirmed` | `bool` | Set `true` when the linking email was provider-verified (mirrors today's password-signup behavior of auto-confirming). |
| `Status` | `UserStatus` | Unchanged; new OAuth accounts default to `Active` exactly as password accounts do. |
| `AccountType` | `AccountType` (Basic/Premium) | Unrelated billing tier; unaffected — new accounts default `Basic`. |
| `CreatedAt` / `UpdatedAt` | `DateTimeOffset` | Set on creation as today. |
| Role (via `UserManager.AddToRoleAsync`) | `AppRoleNames` | New OAuth-created accounts are assigned `PENDING`, identical to `RegisterAsync` today, so they flow into the existing onboarding funnel (User Story 2). |

**New validation rule introduced by this feature**: account creation (via any path — password or OAuth2) is blocked if the resolved age/DOB indicates the person is under 16 (FR-011). This is enforced at whichever point age becomes known: at OAuth callback time if the provider supplied it, or during the existing profile-completion step if self-reported later.

### External Login (existing table, newly used — ASP.NET Core Identity's `AspNetUserLogins` / `IdentityUserLogin<Guid>`)

This is the "Linked Identity Provider" entity from the spec's Key Entities section. No new model is defined — it maps 1:1 onto Identity's built-in `UserLoginInfo`:

| Field (Identity's `IdentityUserLogin<Guid>`) | Spec concept | Notes |
|---|---|---|
| `LoginProvider` | Provider name | One of `Google`, `Facebook`, `Apple` (ASP.NET Core auth scheme names). |
| `ProviderKey` | Provider-issued identity reference | The subject/user-id the provider assigns; stable per person per provider. |
| `ProviderDisplayName` | — | Human-readable provider name for account-settings UI ("linked accounts" list), out of scope to build a UI for in this feature but the data is captured for future use. |
| `UserId` | FK → `ApplicationUser.Id` | One user can have multiple linked providers (FR-010 auto-linking produces exactly this: same `UserId`, multiple `LoginProvider` rows). |

A "date linked" timestamp is not a native Identity column; if needed for auditing it is covered by FR-014's authentication-event log (see below) rather than a new column, to avoid widening a framework-owned table.

### Profile (existing — `GlobalScout.Domain.Users.Profile`)

No schema change. `FirstName`/`LastName` are populated from the provider's name claim when available (FR-005); `Age` is populated from the provider's birthdate/age claim when available, otherwise left `null` and collected later exactly as today's self-reported flow already does for password sign-ups. `Position`, `ClubName`, and the rest remain unset until the existing profile-completion journey collects them — this feature does not change what "complete" means for a basic player profile.

### Basic Player Profile completion status (existing — derived, not stored redundantly)

The spec's "completion status flag" already exists as the combination of (a) account `Role` (`PENDING` vs `PLAYER`) and (b) the player identity claim status (`Unmatched`/`Claimed`/`PendingVerification`/`SelfReported`/`Verified`/`Rejected`) consumed by `resolvePlayerOnboardingRedirect`. This feature does not add a new completion flag — an OAuth-created account is "incomplete" in exactly the same terms a password-created account is.

### Authentication/account-creation audit log (FR-014)

Reuses whatever logging mechanism today's `LoginUserCommandHandler`/`RegisterUserCommandHandler` already emit through `ILogger<UserIdentityStore>` (see existing `logger.LogWarning` calls for failure paths). This feature adds equivalent log entries for: external-login challenge started, callback succeeded/failed, new-account-via-OAuth created, existing-account auto-linked, and age-gate rejection — no new log storage/table is introduced.

## State transitions

```
Visitor
  │  chooses provider, completes consent (User Story 1)
  ▼
Provider callback received
  │
  ├─ email not provider-verified AND matches an existing account
  │     → reject auto-link; redirect to sign-in with original method (FR-010)
  │
  ├─ age/DOB supplied and < 16
  │     → block account creation, show explanation (FR-011)
  │
  ├─ ProviderKey already linked to a User
  │     → sign in to that existing User (User Story 3 / FR-009)
  │
  ├─ verified email matches an existing User (different provider or password)
  │     → link new ExternalLogin row to that User, sign in (FR-010)
  │
  └─ no match at all
        → create new ApplicationUser (role=PENDING), create Profile with
          whatever fields the provider supplied, create ExternalLogin row,
          sign in (FR-001..FR-006)

New/updated User signed in
  │
  ▼
PENDING role?
  ├─ yes → existing onboarding funnel (/onboarding/account-type → player
  │         identity claim states) — User Story 2, unchanged by this feature
  └─ no  → main platform experience
```
