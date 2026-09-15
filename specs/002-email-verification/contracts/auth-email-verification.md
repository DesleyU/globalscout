# API Contract: Email Verification Endpoints

Base path: `api/auth` (per existing `AuthRoutes.Base`). Both endpoints follow the existing
`IEndpoint` + `ICommand<TResult>`/`ICommandHandler` pattern (see `PostAuthRegister.cs`); success
and failure are surfaced via `result.Match(success, CustomResults.Problem)`, same as `Register`.

## `POST /api/auth/verify-email`

Consumes a verification link's token and marks the account's email verified. Anonymous — the
token itself is the credential (matches FR-005/FR-008: no account context is required or
revealed).

**Request body**:

```json
{ "token": "string (required, opaque — an ASP.NET Core Identity email-confirmation token, base64url-encoded)" }
```

**Success response** — `200 OK`:

```json
{ "message": "Email verified successfully" }
```

or, when the account was already verified before this call (User Story 1, scenario 3 — the spec
requires this be told to the person "without treating it as an error", so the handler checks
`EmailConfirmed` before calling `ConfirmEmailAsync` and returns this distinct, still-200 outcome
rather than the generic failure below):

```json
{ "message": "Your email is already verified" }
```

Effect: `UserManager.ConfirmEmailAsync(user, token)` sets the associated
`ApplicationUser.EmailConfirmed` to `true`. No token record is "consumed" server-side (the token
is stateless — see research.md §2); a second submission of the same token after this point hits
the already-verified branch above, not the token-validity failure below.

**Failure response** — `400 Bad Request` (generic "invalid" — FR-008 requires this to cover
*all* of: expired, superseded, or entirely unrecognized/tampered tokens, indistinguishably):

```json
{ "message": "This verification link is invalid or has expired." }
```

## `POST /api/auth/resend-verification`

Issues a new verification token for the *caller's own* account and sends a new email. Requires
authentication (uses the existing Bearer-forwarding pattern) — resend is not accept-any-email,
to avoid becoming an account-enumeration oracle (see research.md §5). No request body.

**Success response** — `200 OK`:

```json
{ "message": "Verification email sent" }
```

Effect: the account's `SecurityStamp` is rotated (invalidating any previously issued, still-valid
confirmation token — FR-007), a new token is generated via
`UserManager.GenerateEmailConfirmationTokenAsync`, `ApplicationUser.LastVerificationEmailSentAt`
is set to `now`, and a new email is dispatched via `IEmailSender`.

**Failure responses**:

- `409 Conflict` — caller's account is already verified (FR-009):

  ```json
  { "message": "Your email is already verified" }
  ```

- `429 Too Many Requests` — caller requested a resend within the throttle cooldown window of
  `LastVerificationEmailSentAt` (FR-010):

  ```json
  { "message": "Please wait before requesting another verification email" }
  ```

- `401 Unauthorized` — no valid session (standard auth failure, same as any other authenticated
  endpoint in this API).

## Frontend surface (not a backend contract, noted for completeness)

- `GET https://globalscout.eu/verify-email?token=...` — the actual link a person clicks from
  their email client. Renders `app/(auth)/verify-email/page.tsx`, which reads `token` from the
  query string and calls the BFF proxy `POST /api/auth/verify-email` (`app/api/auth/verify-email/route.ts`),
  which forwards to the backend contract above. The token never reaches the API as a query
  parameter (research.md §5).
