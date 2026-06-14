# Stage 02: Aspire And Environment Integration

## Goal

Make the new Next.js app a first-class local development resource in the existing .NET Aspire setup.

The preferred developer workflow should be starting `GlobalScout.AppHost` and opening the web app from the Aspire dashboard.

## Source Of Truth

Read first:

- `docs/next-web-platform-plan.md`
- `docs/AWS-infrastructure_setup_documentation.md`
- `src/api/GlobalScout.AppHost/AppHost.cs`
- `src/api/GlobalScout.AppHost/GlobalScout.AppHost.csproj`

## Scope

- Add `src/ui/apps/web` to `GlobalScout.AppHost`.
- Inject the API HTTPS endpoint into the Next app as `NEXT_PUBLIC_API_BASE_URL`.
- Inject any needed SignalR/public API origin variables from the API HTTPS origin.
- Feed the Aspire-assigned web origin back into API CORS.
- Add or update root scripts needed by Aspire to start the web app.
- Add local environment examples for standalone web development.

## Expected Files

- `src/api/GlobalScout.AppHost/AppHost.cs`
- `src/api/GlobalScout.AppHost/GlobalScout.AppHost.csproj`, only if needed
- `src/ui/apps/web/.env.example`
- `package.json`
- `docs/next-web-platform-plan.md`, if any integration detail changes

## Implementation Notes

- The browser must call the API through an absolute API URL.
- Do not rely on relative `/api` calls from the frontend domain.
- Mirror the existing Aspire CORS pattern, where the assigned frontend origin is injected into `Cors__AllowedOrigins`.
- Keep the legacy Vite app out of the normal new-UI development path.
- Use pnpm workspace commands.

## Acceptance Criteria

- Starting the AppHost starts Postgres, Ministack, the API, and the new Next.js web app.
- Aspire dashboard shows the Next app as a resource with logs and endpoint links.
- The Next app receives `NEXT_PUBLIC_API_BASE_URL` pointing to the Aspire API HTTPS endpoint plus `/api`.
- API CORS accepts the Aspire-assigned Next origin.
- Standalone `pnpm dev:web` still works with `.env.example` guidance.

## Handoff

After this stage, agents can build authenticated UI against the local API by running the Aspire AppHost instead of manually juggling separate frontend/backend terminals.
