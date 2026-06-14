# Stage 05: Landing Page

## Goal

Implement the public landing page at `/` using the Figma design as a visual guide.

This stage should create a production-quality marketing surface with placeholder assets where exact exports are unavailable.

## Source Of Truth

Read first:

- `docs/next-web-platform-plan.md`
- `docs/figma-specs.md`

## Scope

- Implement the landing page at `/`.
- Build reusable marketing components.
- Use placeholder images/logos when exact Figma assets are not available.
- Keep implementation aligned with Tailwind CSS v4 and current shadcn/ui conventions.

## Expected Files

- `src/ui/apps/web/app/(marketing)/page.tsx`, or `src/ui/apps/web/app/page.tsx` if the route group shape requires it
- `src/ui/apps/web/components/marketing/**`
- `src/ui/apps/web/components/layout/Navbar.tsx`
- `src/ui/apps/web/components/layout/Footer.tsx`
- `src/ui/apps/web/hooks/use-scrolled.ts`, if needed
- `src/ui/apps/web/public/**`, for placeholder assets

## Page Sections

Follow the Figma-guided sequence:

- Navbar, transparent over hero then solid on scroll
- Hero
- Stats bar
- For Players
- For Scouts
- For Clubs
- How It Works
- CTA
- Footer

## Implementation Notes

- Do not copy Figma-generated React or Tailwind code verbatim.
- Recreate the design with typed components, accessibility, responsive behavior, and current Tailwind v4 conventions.
- Use Next image/font optimization where appropriate.
- Use shadcn/ui primitives only when they fit naturally.
- Primary CTAs should lead to `/sign-in` or account creation/onboarding depending on current product flow.

## Acceptance Criteria

- `/` renders a polished responsive landing page.
- Mobile and desktop layouts are handled.
- Navbar scroll state works if implemented.
- Placeholder assets are clearly replaceable.
- No auth is required for the landing page.
- Lint and type checks pass.

## Handoff

After this stage, the public acquisition page is ready, and later agents can refine copy/assets without changing the app architecture.
