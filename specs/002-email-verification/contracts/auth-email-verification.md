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
{ "token": "string (required, opaque)" }
```

**Success response** — `200 OK`:

```json
{ "message": "Email verified successfully" }
```

Effect: the associated `ApplicationUser.EmailConfirmed` becomes `true`; the token row's
`ConsumedAt` is set; the account's other outstanding tokens (if any) are unaffected by this call
(they would already be `SupersededAt`-set per FR-007, since only the latest token is ever valid).

**Failure response** — `400 Bad Request` (generic "invalid" — FR-008 requires this to cover
*all* of: expired, already-used, superseded, or entirely unrecognized tokens, indistinguishably):

```json
{ "message": "This verification link is invalid or has expired." }
```

**Idempotency note** (User Story 1, scenario 3): if the token was already consumed by an earlier
call and the account is *already verified*, the endpoint still returns the generic failure body
above per FR-008's "don't reveal state" rule for the token itself — but the frontend confirmation
page separately checks the *caller's own* session (if any) to show a friendlier "you're already
verified" message when the person is signed in, rather than relying on this endpoint to
distinguish the case.

## `POST /api/auth/resend-verification`

Issues a new verification token for the *caller's own* account and sends a new email. Requires
authentication (uses the existing Bearer-forwarding pattern) — resend is not accept-any-email,
to avoid becoming an account-enumeration oracle (see research.md §5). No request body.

**Success response** — `200 OK`:

```json
{ "message": "Verification email sent" }
```

Effect: a new `EmailVerificationToken` row is issued (`IssuedAt = now`, `ExpiresAt = now + 24h`);
any previously outstanding token for this account gets `SupersededAt = now` (FR-007); a new email
is dispatched via `IEmailSender`.

**Failure responses**:

- `409 Conflict` — caller's account is already verified (FR-009):

  ```json
  { "message": "Your email is already verified" }
  ```

- `429 Too Many Requests` — caller requested a resend within the throttle cooldown window of the
  current active token's `IssuedAt` (FR-010):

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
