# Stage 01: Workspace And Next.js Scaffold

## Goal

Create the TypeScript workspace foundation for the new GlobalScout web platform.

This stage establishes `src/ui/apps/web` and `src/ui/packages/shared` without implementing the full product UI yet. The legacy `frontend/` remains only as a short-lived reference.

## Source Of Truth

Read first:

- `docs/next-web-platform-plan.md`
- `docs/AWS-infrastructure_setup_documentation.md`

## Scope

- Add root workspace configuration using pnpm.
- Scaffold `src/ui/apps/web` with Next.js App Router, React 19, TypeScript strict mode, latest stable Tailwind CSS v4, ESLint, shadcn/ui, and Base UI primitives.
- Add `src/ui/packages/shared` as a TypeScript package for cross-platform types and utilities.
- Fix `.gitignore` so `src/ui/packages/shared` is tracked.
- Add basic root scripts for web development, build, lint, and type checking.

## Expected Files

- `package.json`
- `pnpm-workspace.yaml`
- `pnpm-lock.yaml`
- `src/ui/apps/web/**`
- `src/ui/packages/shared/**`
- `.gitignore`

## Implementation Notes

- Use latest stable package versions. Do not pin guessed versions manually.
- Use Tailwind CSS v4 conventions, not older Figma-generated Tailwind snippets.
- Use shadcn/ui with Base UI as the default primitive layer.
- Keep `frontend/` intact.
- Keep `src/ui/packages/shared` UI-free. It should contain shared types, constants, schemas, and API utilities only.

## Acceptance Criteria

- `pnpm install` succeeds.
- `pnpm dev:web` starts the Next app.
- `pnpm build:web` succeeds for the scaffold.
- `pnpm lint:web` succeeds.
- `src/ui/packages/shared` is importable from `src/ui/apps/web`.
- No production Docker or AWS deployment cutover is done in this stage.

## Handoff

After this stage, the repo should have a working Next.js app shell and shared package foundation ready for Aspire integration and API client work.
