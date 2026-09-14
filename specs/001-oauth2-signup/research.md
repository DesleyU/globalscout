# Research: OAuth2 Social Sign-Up

## Existing foundations discovered (not net-new)

These already exist in the codebase and materially shrink this feature's scope:

- **Identity stack**: ASP.NET Core Identity (`UserManager<ApplicationUser>`, `ApplicationUser : IdentityUser<Guid>`) backed by EF Core/PostgreSQL, already provisions the standard Identity schema — including `AspNetUserLogins`, the exact table `UserManager.AddLoginAsync` / `FindByLoginAsync` use to store external-provider identities. No new linking table needs to be designed; it needs to be *used*.
- **Pending-role onboarding**: `RegisterUserCommandHandler` → `UserIdentityStore.RegisterAsync` already creates new users with role `PENDING` (`AppRoleNames.Pending`). The frontend already redirects `PENDING` users to `/onboarding/account-type` (`getPostAuthRedirect` in [src/ui/apps/web/lib/auth/get-post-auth-redirect.ts](../../src/ui/apps/web/lib/auth/get-post-auth-redirect.ts)), and once a player identity claim exists, `resolvePlayerOnboardingRedirect` (in `lib/auth/onboarding-redirect.ts`) routes through claim states (`Unmatched` → empty profile home, `Claimed` → claim step, `PendingVerification` → submitted, `Verified`/`SelfReported` → dashboard). **User Story 2 ("complete required player-profile details later") is this existing flow.** This feature's job is to land a new OAuth-created user in the same `PENDING` state so they fall into the same funnel — not to build a parallel profile-completion step.
- **Session/token model**: `IJwtTokenIssuer.IssueAccessToken(userId, email, role)` issues the JWT; the Next.js BFF sets it as an httpOnly cookie (`AUTH_TOKEN_COOKIE`, see [src/ui/apps/web/app/api/auth/sign-in/route.ts](../../src/ui/apps/web/app/api/auth/sign-in/route.ts)). This feature reuses that issuer and cookie mechanism verbatim; it does not introduce a second session model (consistent with the spec's Assumptions).
- **Frontend placeholder**: `SocialAuthButtons` ([src/ui/apps/web/components/auth/social-auth-buttons.tsx](../../src/ui/apps/web/components/auth/social-auth-buttons.tsx)) already renders disabled "Coming soon" Google and Apple buttons on the sign-in/create-account screens. There is **no Facebook button yet** — one must be added. The existing two need to go from `disabled` placeholders to real links.

## Decision: OAuth2 handler libraries per provider

**Decision**: Use ASP.NET Core's built-in remote-authentication handlers rather than a hand-rolled OAuth2/PKCE client:
- Google → `Microsoft.AspNetCore.Authentication.Google` (official)
- Facebook → `Microsoft.AspNetCore.Authentication.Facebook` (official)
- Apple → `AspNet.Security.OAuth.Apple` (aspnet-contrib), since Microsoft ships no first-party Sign in with Apple handler; this package correctly implements Apple's client-secret-as-signed-JWT requirement and `form_post` response mode.

**Rationale**: These handlers are already the pattern ASP.NET Core Identity is designed to plug into (`ExternalLoginInfo`, `SignInManager.GetExternalLoginInfoAsync`), they handle CSRF/state and token exchange correctly, and they keep the API app as the single OAuth2 client — consistent with `Microsoft.AspNetCore.Authentication.JwtBearer` and `Microsoft.AspNetCore.Identity.EntityFrameworkCore` already referenced in `GlobalScout.Infrastructure.csproj`. Hand-rolling the authorization-code exchange for three providers would duplicate well-tested framework code and increase security surface for no benefit.

**Alternatives considered**: A third-party umbrella library (e.g. a generic social-login SDK) was rejected — it would sit awkwardly against the existing `UserManager`/`SignInManager` based Identity setup and pull in an unfamiliar abstraction for marginal benefit over the framework's native external-login support.

## Decision: browser flow shape (API-hosted redirect + short-lived handoff code)

**Decision**: The ASP.NET Core API hosts the OAuth2 challenge and callback endpoints directly (`GET /api/auth/external/{provider}/challenge`, `GET /api/auth/external/{provider}/callback`), because the framework's remote-auth handlers are designed to own the redirect round-trip. After a successful callback, the API does **not** put the JWT in the redirect URL. Instead it:
1. Finds-or-creates the `ApplicationUser` and (per FR-010) links or blocks per verified-email match.
2. Mints a single-use, short-TTL (60s) opaque handoff code bound to the new session, stored server-side.
3. Returns a minimal, self-submitting HTML page (`response_mode=form_post` style, the same technique Apple's own Sign in with Apple callback uses) that POSTs `code` to `https://globalscout.eu/api/auth/external/complete` — **not** a `302` with the code in the query string. (A `Content-Security-Policy: form-action` header was tried as extra defense-in-depth here but dropped during implementation: it hit a real Chrome inconsistency that blocked the legitimate submission even with a spec-compliant policy. The page needs no CSP to be safe — it's fully server-generated with no attacker-controlled content, and the actual security properties come from the POST-body mechanism itself plus the code's single-use, 60s TTL.)
4. The Next.js BFF route handler receives that POST server-side, exchanges the code server-to-server for the JWT (`POST /api/auth/external/exchange`), sets the existing `AUTH_TOKEN_COOKIE` exactly as `sign-in/route.ts` does today, and issues its own `302` to the existing `getPostAuthRedirect(role, token)` destination — a clean URL with no code in it.

**Rationale**: Putting a long-lived JWT directly in a redirect URL is a known OAuth anti-pattern (URLs get logged, cached, and land in browser history/referrer headers). A single-use, short-TTL opaque code is the standard mitigation for the *token itself* — but the code still has to cross the browser from the API's origin to the frontend's origin, since they are separate servers with no shared request context. Carrying it as a `302 GET ?code=` would still expose it to browser history, typical server/CDN access-log formats, and the `Referer` header of anything the landing page loads before the URL changes again. Using a POST body instead (via a tiny auto-submitting form, same as Apple's `form_post` response mode) avoids all three: POST bodies aren't part of the URL, so they don't appear in history or `Referer`, and most access-log formats don't capture bodies. The exchange itself still happens entirely server-side inside the Next.js Route Handler — the code is never rendered into a client component or exposed to client-side JS either way.

**Alternatives considered**: Handling the entire OAuth2 flow inside Next.js (Node-side) was rejected — the API already owns `UserManager`/`ApplicationUser`/JWT issuance, and duplicating identity logic in the BFF would violate Principle IV (minimal, convention-matching diffs) and split the single source of truth for account creation across two runtimes. Having the API set a cross-subdomain cookie (`Domain=.globalscout.eu`) directly, skipping the frontend exchange step entirely, was also considered and rejected: it would split cookie-setting authority between the API and the BFF, breaking the existing convention (documented in `CLAUDE.md`) that only the Next.js BFF ever sets `AUTH_TOKEN_COOKIE`, for a marginal gain over the form_post approach.

## Decision: what "verified email" means per provider (for FR-010 auto-linking)

**Decision**: Treat an email as provider-verified when:
- **Google**: the ID token's `email_verified` claim is `true`.
- **Apple**: the identity token's `email_verified` claim is `true` (Apple issues this on every Sign in with Apple token).
- **Facebook**: the Graph API only returns an `email` field for addresses Facebook itself has already verified with the account holder — its presence in the response is treated as verified.

If a provider's response doesn't satisfy the above (e.g. Google returns an email with `email_verified=false`), FR-010 treats it as unverified: no auto-link, direct the person to sign in with their original method instead.

**Rationale**: This is the accurate, provider-specific behavior needed to implement FR-010 correctly; it's documented once here so the Application-layer linking logic doesn't need per-provider special-casing scattered through the code — it consumes a single normalized "is this email verified" boolean produced at the Infrastructure layer.

## Decision: real-world availability of age/date-of-birth (informs FR-011 and User Story 2 scope)

**Finding**: Age/birthdate is **not reliably available** from any of the three providers in practice:
- Google's `birthdate` claim requires a sensitive scope Google restricts to verified apps and is frequently empty even when granted.
- Facebook's `birthday` field requires App Review approval for the `user_birthday` permission and is commonly denied or omitted by the person.
- Apple's Sign in with Apple **never** exposes birthdate — it is not part of the data Apple shares, by design.

**Decision**: Design FR-003/FR-004 assuming email and name are commonly available but age/DOB is the exception, not the rule. The minimum-age check in FR-011 will, in the common case, run against **self-reported** age collected during the existing profile-completion/onboarding step (User Story 2's territory) rather than provider-supplied data. The plan must not assume provider-supplied age is the primary enforcement path.

**Rationale**: This changes where the age-gate actually has to live in the implementation (mostly in the onboarding step, occasionally at OAuth callback time) and prevents building a flow that silently never triggers its main enforcement path in production.

## Decision: integration testing strategy for third-party IdPs

**Decision**: Integration tests (Testcontainers-backed Postgres, per Constitution Principle II) exercise the account-creation/linking/token-issuance logic by registering a test `AuthenticationHandler` that stands in for the remote OAuth2 handshake and hands back a fixed, scenario-controlled `ExternalLoginInfo` (email, verified flag, name, provider key) — the same shape `SignInManager.GetExternalLoginInfoAsync` produces for a real provider. Real Postgres is used throughout; only the third-party network hop is substituted, since Google/Facebook/Apple cannot be called from CI. Unit tests cover the find-vs-create-vs-link decision logic in isolation.

**Rationale**: Satisfies Principle II's intent (real database, no mocked persistence) while acknowledging the constitution's Testcontainers mandate is scoped to *this project's* infrastructure dependencies (database, object storage) — a live third-party IdP is outside that scope and untestable in CI regardless of approach.

## Decision: configuration/secrets convention

**Decision**: New OAuth client credentials follow the existing `Section__Key` double-underscore convention already used for `Jwt__*` and `Stripe__*` (see `docker-compose.yml`): `Authentication__Google__ClientId`/`ClientSecret`, `Authentication__Facebook__ClientId`/`ClientSecret`, `Authentication__Apple__ClientId`/`KeyId`/`TeamId`/`PrivateKey`. Local dev wires these through .NET Aspire AppHost / user-secrets; production through the existing EC2 Docker Compose environment-variable injection.

**Rationale**: Matches Principle IV (match existing conventions) and avoids introducing a second configuration pattern.

## Open follow-ups for implementation (not blocking this plan)

- Registering real OAuth2 app credentials with Google/Meta/Apple (developer console setup, redirect URI allowlisting) is an operational task for whoever owns those accounts, not a code task — flagged here so `/speckit-tasks` can include a checklist item, not a design decision.
- Per Constitution Principle V, the exact production callback/redirect URLs (`https://api.globalscout.eu/api/auth/external/{provider}/callback`, `https://globalscout.eu/api/auth/external/complete`) must be checked against `docs/AWS-infrastructure_setup_documentation.md` and `.cursor/rules/aws-production-architecture.mdc` before nginx/CORS changes are made during implementation.
