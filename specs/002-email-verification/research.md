# Phase 0 Research: Email Verification for Password Accounts

## 1. Email delivery provider

**Decision**: Use AWS Simple Email Service (SES) via a new `IEmailSender` abstraction (`GlobalScout.Application/Abstractions/Email/`), implemented in `GlobalScout.Infrastructure/Auth/Email/SesEmailSender.cs` using `AWSSDK.SimpleEmail`.

**Rationale**: No email-sending infrastructure exists anywhere in the repo today (confirmed: no `IEmailSender`, no SMTP/SES/SendGrid reference in any `appsettings*.json`, `docker-compose.yml`, or AWS infra docs). The project already runs entirely on AWS (CloudFront → ALB → EC2, S3 for media via an `ObjectStorage` config section using AWS SDK conventions), and already has an AWS account/credentials story in place for S3. SES is the natural fit: no new vendor relationship, same credential/IAM model can be extended, and it avoids introducing a third-party SaaS dependency (SendGrid, Postmark) purely for one transactional email. A new `Email` config section (`Provider`, `Region`, `FromAddress`, credentials, `EndpointUrl` for local override) will be added to `appsettings.json` alongside the existing `ObjectStorage`, `ApiFootball`, and `Stripe` sections — `EndpointUrl` mirrors the pattern `ObjectStorage` already uses to redirect the S3 client at Ministack locally instead of real AWS.

**Local/test environment — reuse Ministack, no new container**: `ministackorg/ministack` (already run by `GlobalScout.AppHost/AppHost.cs` and `GlobalScout.Api.IntegrationTests/IntegrationTestFixture.cs` for S3) emulates roughly 20 AWS services, **including SES** (confirmed via its Docker Hub listing: S3, SQS, SNS, DynamoDB, IAM, Secrets Manager, SES, and others, on the same edge port 4566 LocalStack-style). This means `SesEmailSender` can point at Ministack's endpoint in dev/test — via the same `Email__EndpointUrl` environment variable pattern already used for `ObjectStorage__EndpointUrl` — with **zero new containers**, and real AWS SES in production by simply leaving `EndpointUrl` unset. This also means integration tests can exercise real SES-shaped calls through Testcontainers exactly like they already do for S3 (Constitution Principle II), rather than needing an `IEmailSender` fake at the test boundary as an earlier draft of this plan assumed. The exact mechanism for retrieving a "sent" email's content/link back out of Ministack for test assertions (a list-messages-style call, if Ministack's SES emulation exposes one) needs confirming against Ministack's actual behavior during implementation — not re-derived here.

**Alternatives considered**:
- **A dedicated local SMTP dev-server (e.g. Mailpit) as a new container** — considered and rejected: Ministack already provides SES emulation and is already wired into both `AppHost.cs` and the integration test fixture; adding a second container for the same job duplicates existing infrastructure (Constitution Principle IV).
- **SMTP relay** (e.g. via a generic `SmtpClient` against SES's SMTP interface) — rejected: the SES API (used directly, and now available locally via Ministack) offers no observability/bounce-handling disadvantage versus SMTP, and matches the existing `AWSSDK.*` client pattern already used for S3 rather than introducing a second protocol.
- **SendGrid / Postmark** — rejected: introduces a new third-party vendor, new API key management, and new billing relationship for a single transactional email use case the existing AWS account (and its local Ministack stand-in) can already cover.

## 2. Verification token generation and validation

**Decision**: Use ASP.NET Core Identity's built-in email confirmation token infrastructure —
`UserManager<ApplicationUser>.GenerateEmailConfirmationTokenAsync(user)` to issue a link token and
`ConfirmEmailAsync(user, token)` to consume one — instead of a custom persisted token table.

**Rationale**: `.AddIdentity<ApplicationUser, ApplicationRole>(...).AddDefaultTokenProviders()` is
already registered (`GlobalScout.Infrastructure/DependencyInjection.cs:138-148`), and
`UserManager<ApplicationUser>` is already injected throughout `Auth` — including in
`UserIdentityStore.cs` and `ApplicationUserCreator.cs`, the exact files this feature touches. The
default token provider (`DataProtectorTokenProvider`) already:
- Produces an unguessable, opaque, cryptographically protected token (satisfies FR-003) with no
  code of our own to write or review.
- Is time-limited via `DataProtectionTokenProviderOptions.TokenLifespan`, which defaults to 24
  hours — already matching FR-004 with zero configuration required (an explicit config line is
  still added for documentation/future-proofing, see decision below).
- Validates the token by regenerating it internally and checking it against the user's current
  `SecurityStamp` (already a column on `AspNetUsers` via the base `IdentityUser<Guid>`) plus the
  embedded issue time — meaning **no database table, no custom hashing scheme, and no comparison
  logic of our own is needed at all**. This is a direct application of Constitution Principle IV
  (minimal, convention-matching diffs): the framework capability the project already depends on
  for identity does this job.

Originally this plan specified a custom `EmailVerificationToken` table modeled after the
in-memory `HandoffCodeStore` precedent. That was unnecessary: `HandoffCodeStore` exists because
OAuth handoff codes need a *short-lived, provider-agnostic, non-Identity* concept with no
associated `ApplicationUser` row yet at the point of issuance — a genuinely different problem.
Email verification is about an already-created `ApplicationUser`, which is exactly the case
Identity's own token providers are built for.

**Alternatives considered**:
- **Custom persisted `EmailVerificationToken` table with a hashed random value** (the original
  approach in this plan) — rejected on reflection: reimplements what `DataProtectorTokenProvider`
  already provides, adds a migration, a new entity, and hashing/comparison code with no capability
  gain.
- **Encode verification state in a hand-rolled signed/stateless token (e.g. a bespoke JWT)** —
  rejected: this is precisely what `DataProtectorTokenProvider` already is; no reason to hand-roll
  it.
- **Reuse/extend `HandoffCodeStore`'s in-memory pattern** — rejected: still in-memory (would not
  survive a restart within the 24h window), and solves a different problem shape (pre-account
  handoff, not post-account email confirmation).

## 3. Single-use behavior and "already verified" idempotency (FR-005, US1 scenario 3)

**Decision**: The `VerifyEmail` handler checks `ApplicationUser.EmailConfirmed` first. If already
`true`, it returns the "already verified" outcome without calling `ConfirmEmailAsync` again. If
`false`, it calls `ConfirmEmailAsync(user, token)`; on success `EmailConfirmed` becomes `true`
(terminal). A second click of the *same* link after that point hits the "already verified" branch
on the first check — matching the spec's required behavior ("tells them the email is already
verified without treating it as an error") without needing to explicitly invalidate the token
value itself.

**Rationale**: `ConfirmEmailAsync` alone does not reject a structurally-still-valid, unexpired
token merely because the email was already confirmed by an earlier call — it would simply
re-confirm (a no-op). Gating on the account's own `EmailConfirmed` flag first is simpler than
trying to make the token single-use at the token-validation layer, and it directly matches the
acceptance scenario's required wording/outcome.

## 4. Throttling repeated resend requests (FR-010) and superseding prior links (FR-007)

**Decision**: Add one new nullable column to the existing `ApplicationUser`
(`LastVerificationEmailSentAt DateTimeOffset?`) — not a new table. `ResendVerificationEmail`:
1. Rejects with 429 if `now - LastVerificationEmailSentAt` is under the cooldown window (e.g. 60s) — satisfies FR-010.
2. Otherwise calls `UserManager.UpdateSecurityStampAsync(user)` — this invalidates any
   previously issued, still-outstanding confirmation token for this account, because that token
   was signed against the *old* stamp (satisfies FR-007 with no explicit "supersede" bookkeeping).
3. Calls `GenerateEmailConfirmationTokenAsync(user)` to produce the new token (now signed against
   the new stamp) and updates `LastVerificationEmailSentAt = now`.

**Rationale**: No rate-limiting middleware or shared cache exists anywhere in the codebase today
(confirmed via search), and one column is the smallest possible addition that satisfies both
FR-007 and FR-010 — smaller than the single-table version originally planned, and far smaller
than general-purpose rate-limiter middleware, which would be disproportionate for one endpoint
(Constitution Principle IV).

**Trade-off to note explicitly**: rotating the security stamp also invalidates *any other*
outstanding Identity token type for this user that happens to depend on the same stamp (e.g. a
future password-reset token, if/when that feature is added, since it would share the same
`DataProtectorTokenProvider` family). Today nothing else in this codebase issues such tokens (no
password-reset feature exists yet — confirmed in prior research), so there is no present conflict.
This is worth a one-line comment in the implementation noting the coupling, so a future
password-reset feature doesn't get silently invalidated by a verification-email resend (or vice
versa).

**Alternatives considered**:
- **The original custom-table "supersede" approach** — rejected per decision #2 above; stamp
  rotation achieves the same outcome using framework machinery already in place.
- **ASP.NET Core built-in rate limiter middleware for FR-010** — rejected for now: no existing
  precedent in this repo, and one column is simpler for a single endpoint.

## 5. Endpoint shape

**Decision**: `POST /api/auth/verify-email` (body: `{ token }`) and `POST /api/auth/resend-verification` (authenticated, uses the caller's own account — no body needed), following the existing `IEndpoint` + `AuthRoutes` + `ICommand`/`ICommandHandler` pattern used by `PostAuthRegister.cs` and the `ExternalLogin` endpoints.

**Rationale**: The email link itself is a `GET` (an email client follows a link), but it should not directly hit the API — it lands on the frontend confirmation page (`app/(auth)/verify-email/page.tsx`), which reads the token from the query string and calls the existing BFF proxy pattern (`app/api/auth/verify-email/route.ts`) with a `POST`, matching how `Register`/`sign-in` are already proxied (cookie → Bearer forwarding pattern per `src/ui/apps/web/AGENTS.md`). This avoids the token sitting in server access logs as a query parameter on the API itself and keeps the API surface consistent with the rest of `Auth`, which uses `POST` for all mutating actions. Resend is authenticated (uses the signed-in person's own session) rather than accepting an arbitrary email address, consistent with FR-008's "don't reveal account existence" requirement — an unauthenticated resend-by-email endpoint would itself be an enumeration oracle.

Note: an Identity-generated confirmation token can contain URL-unsafe characters (`+`, `/`, `=`)
and must be `WebEncoders.Base64UrlEncode`/`Decode`-wrapped when it transits a URL or JSON body —
standard practice for `GenerateEmailConfirmationTokenAsync` output, not a new design decision, but
worth flagging for the implementation phase since it's easy to omit and causes intermittent
failures only for tokens containing those specific characters.

**Alternatives considered**:
- **`GET /api/auth/verify-email?token=...` directly on the API** — rejected: puts the sensitive token in API server access logs and in the browser's direct request to a different origin, deviating from the BFF proxy convention used everywhere else in this frontend.

## 6. Access-gating for unverified accounts

**Decision**: Out of scope for this feature (per spec Assumptions). This plan implements the verification mechanism (issue, verify, resend, expire) and leaves the account's `EmailConfirmed` flag as the source of truth; whether unverified accounts are blocked from any part of the product is a separate, later decision that can read that same flag without further backend changes here.

**Rationale**: Explicitly deferred in the spec's Assumptions section as a follow-on product decision, not a blocker to specifying/building the verification mechanism itself.
