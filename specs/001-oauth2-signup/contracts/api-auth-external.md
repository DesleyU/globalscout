# Contract: External (OAuth2) Authentication Endpoints

New endpoints under `GlobalScout.Api/Endpoints/Auth/`, added alongside the existing `AuthRoutes` (`api/auth/register`, `api/auth/login`, `api/auth/profile`, `api/auth/logout`). All are `AllowAnonymous`, matching `PostAuthRegister`/`PostAuthLogin`.

## `GET /api/auth/external/{provider}/challenge`

Starts the OAuth2 flow. Browser-navigated (not fetched via XHR/JSON) — the frontend renders this as a plain link/form action from the sign-in and create-account pages, per the "Continue with {Provider}" buttons.

**Path parameters**: `provider` — one of `google`, `facebook`, `apple` (matches the registered ASP.NET Core authentication scheme names). Any other value → `404`.

**Query parameters**: `returnUrl` (optional) — accepted and carried into the internal provider-callback redirect (see `GetAuthExternalChallenge.cs`), but **not currently honored end-to-end**: it is not threaded through the handoff code, so `app/api/auth/external/complete/route.ts` always lands the person on the frontend's standard post-auth destination (`getPostAuthRedirect`) regardless of any `returnUrl` supplied at challenge time. Treat this parameter as reserved/no-op for now rather than a working feature.

**Response**: `302` redirect to the provider's consent screen (framework-managed `ChallengeResult`).

## `GET /api/auth/external/{provider}/callback`

The provider redirects here after consent. Not called directly by the frontend.

**Behavior** (see [data-model.md](../data-model.md) state-transition diagram for the full decision tree):
1. Completes the OAuth2 code exchange via the registered handler (`AddGoogle`/`AddFacebook`/`AddOAuth("Apple", ...)`).
2. Resolves the person to an existing linked account, an auto-linked existing account (verified-email match, FR-010), a newly created account (FR-001–FR-006), or a rejection (FR-011 under-16, or unverified-email collision).
3. On success: mints a single-use handoff code (60s TTL) and returns `200` with a minimal, self-submitting HTML page that POSTs `code={code}` to `{FRONTEND_BASE_URL}/api/auth/external/complete` (`response_mode=form_post` style — see [research.md](../research.md) for why this is a POST body, not a `302 ?code=` redirect: it keeps the code out of the URL, browser history, access logs, and `Referer` headers). No `Content-Security-Policy` header is set on this page — one was tried and dropped during implementation after it hit a real Chrome `form-action` inconsistency; see research.md for why the page is safe without it.
4. On rejection: same form_post mechanism, POSTing `error={reason}` instead, where `reason` is one of `under_age`, `email_in_use`, `provider_error`, `access_denied` — the frontend maps these to the user-facing messages from FR-012/edge cases.

**Errors**: provider-side failure, timeout, or denied consent (FR-012) all resolve to the `error=` form-post shape above — the API never leaves a partially created account (no `ApplicationUser`/`Profile`/`AspNetUserLogins` row is persisted unless step 2 fully succeeds).

## `POST /api/auth/external/complete` (frontend BFF route, receives the form_post)

`app/api/auth/external/complete/route.ts` — the target of the API callback's auto-submitting form. Handles both success (`code`) and rejection (`error`) bodies server-side, then issues a normal `302` to a clean URL (existing `getPostAuthRedirect`, or sign-in with a failure flag) — the code/error never appears in a URL the browser actually lands on.

## `POST /api/auth/external/exchange`

Called server-to-server by `app/api/auth/external/complete/route.ts` above, mirroring how `app/api/auth/sign-in/route.ts` calls the existing login endpoint today.

**Request body**:
```json
{ "code": "string" }
```

**Response `200`** (same shape `PostAuthLogin`/`PostAuthRegister` already return, so the BFF's existing cookie-setting/redirect logic needs no branching):
```json
{
  "token": "string",
  "user": {
    "id": "guid",
    "email": "string",
    "role": "PENDING | PLAYER | CLUB | SCOUT_AGENT | ADMIN",
    "profile": {
      "firstName": "string",
      "lastName": "string",
      "position": "string | null",
      "age": "number | null",
      "clubName": "string | null"
    }
  }
}
```

**Response `400`**: code missing, unknown, already used, or expired — `{ "error": "string", "code": "string" }`, matching the existing `ApiError` shape `sign-in/route.ts` already handles via `isApiError`.

**Single-use enforcement**: the handoff code is invalidated immediately on first successful exchange, regardless of outcome — a replayed code always fails.

## Frontend surface (BFF + UI, not backend-owned)

- `app/api/auth/external/complete/route.ts` (new): accepts the API callback's POSTed `code` or `error` (form_post body, not query string — see above), calls `POST /api/auth/external/exchange` on success, sets `AUTH_TOKEN_COOKIE` exactly as `sign-in/route.ts` does, then redirects via the existing `getPostAuthRedirect(role, token)`. On `error`, redirects to sign-in with a query flag the page uses to render the FR-012 failure message.
- `components/auth/social-auth-buttons.tsx` (modified): the two existing disabled Google/Apple buttons become real links to `{API_BASE}/api/auth/external/google/challenge` / `.../apple/challenge`; a third Facebook button is added (currently missing from this component) linking to `.../facebook/challenge`, per FR-002.
