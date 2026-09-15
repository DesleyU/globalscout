# Phase 1 Data Model: Email Verification for Password Accounts

No new entity/table is introduced. Verification tokens are handled entirely by ASP.NET Core
Identity's existing, already-registered token infrastructure (see research.md §2); the "Email
Verification Request" concept from the spec is realized as transient, stateless tokens rather
than persisted rows.

## Modified entity: `ApplicationUser` (existing — `GlobalScout.Infrastructure/Identity/ApplicationUser.cs`)

One new column added via EF Core migration:

| Field | Type | Notes |
|---|---|---|
| `LastVerificationEmailSentAt` | `DateTimeOffset?` | Null until the first explicit *resend* (registration's automatic first send does not set it — discovered during implementation: doing so spuriously throttled a person's very first resend if it happened soon after signing up). Updated on every resend. Used only to enforce the resend cooldown (FR-010) — see research.md §4. |

Existing fields this feature reads/writes, unchanged in shape:

- `EmailConfirmed` (`bool`, inherited from `IdentityUser<Guid>`) — the single source of truth for
  verification status (spec Key Entity "Internal Account... gains an explicit email-verification
  status"). Set to `false` at internal-account creation (FR-001, replacing today's hardcoded
  `true` in `UserIdentityStore.RegisterAsync`); set to `true` by `ConfirmEmailAsync` on successful
  verification.
- `SecurityStamp` (inherited from `IdentityUser<Guid>`) — not read/written directly by this
  feature's application code, but its rotation (via `UserManager.UpdateSecurityStampAsync`) is the
  mechanism that invalidates a superseded token on resend (FR-007) and, incidentally, on any email
  change (FR-012) — see research.md §4.
- `Email`/`NormalizedEmail` (inherited) — the address a verification email is sent to; unchanged
  by this feature except that a change to this field (existing account-settings behavior, out of
  scope here) is expected to already rotate `SecurityStamp` and therefore already invalidate a
  pending token as a side effect — to be confirmed against the existing email-change code path
  during implementation, not re-derived here.

OAuth2 accounts: unchanged existing behavior (`emailConfirmed: hasRealEmail && info.EmailVerified`
in `ExternalIdentityStore.cs`), untouched by this feature (FR-011).

## Verification token (conceptual — not a stored entity)

| Property | Where it lives |
|---|---|
| Uniqueness / unguessability | `DataProtectorTokenProvider` (ASP.NET Core Identity, already registered) |
| Expiry (24h) | `DataProtectionTokenProviderOptions.TokenLifespan` (framework default; explicit config added for documentation) |
| Binding to one account | Implicit — token is generated from and validated against a specific `ApplicationUser` |
| Invalidation on resend | `SecurityStamp` rotation (research.md §4) |
| Invalidation on expiry | Built into `DataProtectorTokenProvider` validation |
| "Already used" handling | Handled at the application layer by checking `EmailConfirmed` before calling `ConfirmEmailAsync` (research.md §3), not by the token itself |

## State transitions

```text
Account created (internal)
        │
        ▼
 EmailConfirmed = false ──┬──(verify-email: ConfirmEmailAsync succeeds)──► EmailConfirmed = true (terminal)
                          │
                          ├──(resend-verification, outside cooldown)──► SecurityStamp rotated
                          │                                              (invalidates prior token),
                          │                                              new token generated,
                          │                                              LastVerificationEmailSentAt = now
                          │                                              (EmailConfirmed stays false)
                          │
                          ├──(resend-verification, within cooldown)──► 429, no change
                          │
                          └──(verify-email: expired/stale-stamp/unrecognized token)──►
                                                        EmailConfirmed stays false,
                                                        generic "invalid" response
```

## Validation rules (from spec Functional Requirements)

- A verification request MUST NOT reveal whether the supplied token corresponds to an existing
  account when it fails to validate (FR-008) — `ConfirmEmailAsync` failures (expired, stamp
  mismatch, malformed, or user not found) all map to the same generic response.
- Resend requests for an account where `ApplicationUser.EmailConfirmed == true` MUST be rejected
  with an "already verified" response rather than issuing a new token (FR-009).
- Resend requests within the cooldown window of `LastVerificationEmailSentAt` MUST be rejected
  (FR-010).
