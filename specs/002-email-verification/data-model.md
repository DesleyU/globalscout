# Phase 1 Data Model: Email Verification for Password Accounts

## Entity: `EmailVerificationToken` (new)

Represents one outstanding invitation to verify a specific account's email address (spec: "Email Verification Request").

| Field | Type | Notes |
|---|---|---|
| `Id` | `Guid` | Primary key. |
| `UserId` | `Guid` | Foreign key → `AspNetUsers.Id` (`ApplicationUser`). One account may have many historical rows, but at most one *active* (unconsumed, unexpired) row at a time — enforced in application logic, not a DB constraint, since expired/consumed rows are kept for audit rather than deleted. |
| `Email` | `string` | The email address this token verifies — captured at issuance time, so a later email change (FR-012) doesn't retroactively repurpose an old token for a new address. |
| `TokenHash` | `string` | SHA-256 (or equivalent) hash of the random token value. The raw token is never persisted (see research.md §3); only this hash is compared against an incoming request. |
| `IssuedAt` | `DateTimeOffset` | When this token was generated. Used both for expiry calculation and as the basis for resend throttling (FR-010). |
| `ExpiresAt` | `DateTimeOffset` | `IssuedAt + 24h` (FR-004). |
| `ConsumedAt` | `DateTimeOffset?` | Null until the token is successfully used to verify the email; set exactly once (FR-005: single use). |
| `SupersededAt` | `DateTimeOffset?` | Set when a newer token is issued for the same account before this one was consumed (FR-007) or when the account's email changes while this token is outstanding (FR-012). |

**Validity rule** (evaluated at verification time): a token is usable only if `ConsumedAt IS NULL AND SupersededAt IS NULL AND ExpiresAt > now`. Any other state → treated identically to "unrecognized token" in the response (FR-008 — no distinction leaked to the caller between expired, reused, superseded, or simply invalid).

**Relationships**: many `EmailVerificationToken` rows → one `ApplicationUser` (via `UserId`). No navigation property needed on `ApplicationUser` itself; the token store is queried directly by the Application-layer handlers.

## Modified entity: `ApplicationUser` (existing — `GlobalScout.Infrastructure/Identity/ApplicationUser.cs`)

No schema change. The existing ASP.NET Identity `EmailConfirmed` field (currently hardcoded `true` at registration) becomes the single source of truth this feature maintains:

- On internal registration: created with `EmailConfirmed = false` (FR-001).
- On successful token consumption: set to `EmailConfirmed = true`.
- OAuth2 accounts: unchanged existing behavior (`emailConfirmed: hasRealEmail && info.EmailVerified`), untouched by this feature (FR-011).

## State transitions

```text
Account created (internal)
        │
        ▼
 EmailConfirmed = false ──┬──(verify-email: valid token)──► EmailConfirmed = true (terminal)
                          │
                          ├──(resend-verification)──► new EmailVerificationToken issued,
                          │                             prior active token SupersededAt = now
                          │                             (EmailConfirmed stays false)
                          │
                          └──(verify-email: expired/used/superseded/unknown token)──►
                                                        EmailConfirmed stays false,
                                                        generic "invalid" response
```

`EmailVerificationToken` row lifecycle:

```text
Issued (ConsumedAt = null, SupersededAt = null)
   │
   ├──(clicked while valid)────────► ConsumedAt = now                    [terminal: used]
   ├──(new token issued for same account, or email changed)──► SupersededAt = now  [terminal: superseded]
   └──(ExpiresAt passes with no action)──► (no field changes; ExpiresAt < now makes it invalid) [terminal: expired]
```

## Validation rules (from spec Functional Requirements)

- `Email` on the token row must match a real registered email format (already enforced at registration; not re-validated here).
- `TokenHash` must be unique across all rows (collision-negligible given the random source, but a unique index is added defensively).
- A verification or resend request MUST NOT reveal whether `UserId`/`Email` correspond to an existing account when the supplied token/session doesn't resolve one (FR-008).
- Resend requests for an account where `ApplicationUser.EmailConfirmed == true` MUST be rejected with an "already verified" response, not a new token (FR-009).
- Resend requests within the throttle cooldown window of the current active token's `IssuedAt` MUST be rejected (FR-010) — see research.md §4 for the mechanism.
