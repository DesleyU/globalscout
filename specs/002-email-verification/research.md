# Phase 0 Research: Email Verification for Password Accounts

## 1. Email delivery provider

**Decision**: Use AWS Simple Email Service (SES) via a new `IEmailSender` abstraction (`GlobalScout.Application/Abstractions/Email/`), implemented in `GlobalScout.Infrastructure/Auth/Email/SesEmailSender.cs` using `AWSSDK.SimpleEmail`.

**Rationale**: No email-sending infrastructure exists anywhere in the repo today (confirmed: no `IEmailSender`, no SMTP/SES/SendGrid reference in any `appsettings*.json`, `docker-compose.yml`, or AWS infra docs). The project already runs entirely on AWS (CloudFront → ALB → EC2, S3 for media via an `ObjectStorage` config section using AWS SDK conventions), and already has an AWS account/credentials story in place for S3. SES is the natural fit: no new vendor relationship, same credential/IAM model can be extended, and it avoids introducing a third-party SaaS dependency (SendGrid, Postmark) purely for one transactional email. A new `Email` config section (`Provider`, `Region`, `FromAddress`, credentials) will be added to `appsettings.json` alongside the existing `ObjectStorage`, `ApiFootball`, and `Stripe` sections.

**Alternatives considered**:
- **SMTP relay** (e.g. via a generic `SmtpClient`) — rejected: still requires a provider behind it (often SES's own SMTP interface anyway), and offers no observability/bounce-handling advantage over the SES API.
- **SendGrid / Postmark** — rejected: introduces a new third-party vendor, new API key management, and new billing relationship for a single transactional email use case the existing AWS account can already cover.

## 2. Verification token persistence

**Decision**: Persist verification tokens in PostgreSQL as a new `EmailVerificationTokens` table via EF Core migration (`GlobalScoutDbContext`), not in-memory.

**Rationale**: The repo's only existing precedent for an expiring, single-use code — `HandoffCodeStore` (`GlobalScout.Infrastructure/Auth/HandoffCodeStore.cs`) — is an in-memory `ConcurrentDictionary`, explicitly not distributed/multi-instance-safe, and is acceptable there because handoff codes live for seconds during a single OAuth redirect. Verification links must remain valid for up to 24 hours (FR-004) and must survive an app restart or redeploy within that window (deploys are manual but routine per the project's git/deploy workflow) — an in-memory store would silently invalidate outstanding links on every restart. A durable table is the only option that satisfies FR-004/FR-005 reliably.

**Alternatives considered**:
- **Reuse/extend `HandoffCodeStore`'s in-memory pattern** — rejected: fails the 24-hour durability requirement across restarts.
- **Encode verification state in a signed, stateless token (e.g. JWT with expiry) instead of a database row** — rejected: cannot satisfy FR-005 (single-use) or FR-007 (superseding an outstanding link on resend) without server-side state anyway, since a stateless token can't be invalidated before its expiry without a revocation list — which is the same persistence problem in a different shape.

## 3. Token shape and comparison

**Decision**: Generate a cryptographically random, URL-safe token (e.g. 256 bits via `RandomNumberGenerator`), store only its hash in the database (not the raw token), and compare using a constant-time comparison when a verification request arrives.

**Rationale**: Matches standard practice for bearer-style single-use links (same category of concern as password-reset tokens) and ensures a database read/leak does not itself expose valid tokens. FR-003 requires the link be unguessable; FR-008 requires invalid/unrecognized tokens to fail closed without distinguishing "wrong token" from "no such account."

**Alternatives considered**:
- **Store the raw token in plaintext** — rejected: unnecessary exposure if the table is ever read/leaked; hashing is a small, well-understood addition with no user-facing cost.

## 4. Throttling repeated resend requests (FR-010)

**Decision**: Enforce a minimum cooldown (e.g. 60 seconds) between successive verification-email issuances for the same account, checked in the `ResendVerificationEmail` handler against the current outstanding token's `IssuedAt` timestamp — no new infrastructure (e.g. ASP.NET Core `RateLimiter` middleware, Redis) required.

**Rationale**: No rate-limiting middleware or shared cache exists anywhere in the codebase today (confirmed via search). The throttling requirement here is narrow (per-account, single endpoint) and is fully satisfiable by reading the existing/most-recent token row already being fetched for the "supersede prior token" logic (FR-007) — no additional infrastructure needed. Introducing general-purpose rate-limiting middleware for one endpoint would be disproportionate (Constitution Principle IV: minimal, convention-matching diffs).

**Alternatives considered**:
- **ASP.NET Core built-in rate limiter middleware** — rejected for now: would be the right call if throttling needs to generalize across endpoints, but that's not requested here and the repo has no existing precedent for it.

## 5. Endpoint shape

**Decision**: `POST /api/auth/verify-email` (body: `{ token }`) and `POST /api/auth/resend-verification` (authenticated, uses the caller's own account — no body needed), following the existing `IEndpoint` + `AuthRoutes` + `ICommand`/`ICommandHandler` pattern used by `PostAuthRegister.cs` and the `ExternalLogin` endpoints.

**Rationale**: The email link itself is a `GET` (an email client follows a link), but it should not directly hit the API — it lands on the frontend confirmation page (`app/(auth)/verify-email/page.tsx`), which reads the token from the query string and calls the existing BFF proxy pattern (`app/api/auth/verify-email/route.ts`) with a `POST`, matching how `Register`/`sign-in` are already proxied (cookie → Bearer forwarding pattern per `src/ui/apps/web/AGENTS.md`). This avoids the token sitting in server access logs as a query parameter on the API itself and keeps the API surface consistent with the rest of `Auth`, which uses `POST` for all mutating actions. Resend is authenticated (uses the signed-in person's own session) rather than accepting an arbitrary email address, consistent with FR-008's "don't reveal account existence" requirement — an unauthenticated resend-by-email endpoint would itself be an enumeration oracle.

**Alternatives considered**:
- **`GET /api/auth/verify-email?token=...` directly on the API** — rejected: puts the sensitive token in API server access logs and in the browser's direct request to a different origin, deviating from the BFF proxy convention used everywhere else in this frontend.

## 6. Access-gating for unverified accounts

**Decision**: Out of scope for this feature (per spec Assumptions). This plan implements the verification mechanism (issue, verify, resend, expire) and leaves the account's `EmailConfirmed` flag as the source of truth; whether unverified accounts are blocked from any part of the product is a separate, later decision that can read that same flag without further backend changes here.

**Rationale**: Explicitly deferred in the spec's Assumptions section as a follow-on product decision, not a blocker to specifying/building the verification mechanism itself.
