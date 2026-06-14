# Stage 04: Auth Foundation

## Goal

Implement the authentication foundation for the new Next.js app.

This stage should make sign-in real, protect authenticated route groups, and give later UI work a reliable session model.

## Source Of Truth

Read first:

- `docs/next-web-platform-plan.md`
- `src/api/GlobalScout.Api/Endpoints/Auth/**`
- `src/ui/apps/web/lib/api/**`, from Stage 03

## Scope

- Implement `/sign-in`.
- Add session cookie handling through a Next route handler or server action.
- Protect authenticated route groups.
- Add current-user/session bootstrap helpers.
- Add app providers for query client, toasts, theme, and session snapshot if needed.

## Expected Files

- `src/ui/apps/web/app/(auth)/sign-in/page.tsx`
- `src/ui/apps/web/app/api/auth/sign-in/route.ts`, or equivalent route handler
- `src/ui/apps/web/app/api/auth/sign-out/route.ts`, if useful
- `src/ui/apps/web/middleware.ts`, if middleware guards are chosen
- `src/ui/apps/web/lib/auth/**`
- `src/ui/apps/web/features/auth/**`
- `src/ui/apps/web/components/auth/**`
- `src/ui/apps/web/components/providers.tsx`

## Auth Approach

Recommended:

- Sign in through a Next route handler.
- The route handler calls `POST api/auth/login`.
- Store the backend JWT in an HTTP-only cookie.
- Server-side API helpers read the cookie and attach `Authorization: Bearer`.
- Client-side mutations use safe Next route handlers where the token must remain hidden, or call the API directly only when acceptable.

## Routes

- `/sign-in`: public route for users who already have an account.
- Authenticated app routes redirect to `/sign-in` when no valid session exists.
- Public auth routes redirect away when the user is already signed in, where appropriate.

## Implementation Notes

- Use React Hook Form + Zod.
- Use shadcn/ui form primitives.
- Keep token handling out of browser-readable storage.
- Do not implement social login unless backend support exists.
- Forgot password and account creation can remain route placeholders unless explicitly in scope.

## Acceptance Criteria

- A user can sign in through `/sign-in`.
- Authenticated routes are protected.
- The app can fetch the current user/session after sign-in.
- Sign-out clears the session.
- No JWT is stored in localStorage.
- Lint and type checks pass.

## Handoff

After this stage, onboarding and dashboard agents can assume authenticated routes and current-user access are available.
