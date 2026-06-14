# Stage 09: Docker, CI, And Deployment Cutover

## Goal

Move the `ui` service and deployment pipeline from the legacy frontend to the new Next.js app.

This stage should happen after the scaffold, auth, onboarding, and basic app shell are working.

## Source Of Truth

Read first:

- `docs/next-web-platform-plan.md`
- `docs/AWS-infrastructure_setup_documentation.md`
- `docs/AWS-GITHUB-DEPLOYMENT.md`
- `.github/workflows/deploy-aws.yml`
- `docker-compose.yml`
- `deploy/docker-compose.ec2.yml`

## Scope

- Add a production Dockerfile for `src/ui/apps/web`.
- Use Next standalone runtime unless a later decision intentionally constrains the app to static export.
- Update local Docker Compose `ui` service to build/run the new app.
- Update AWS deployment workflow to build the new web image.
- Update production docs to reflect the Next runtime.
- Keep the absolute API URL production invariant.

## Expected Files

- `src/ui/apps/web/Dockerfile`
- `src/ui/apps/web/.dockerignore`, if useful
- `.dockerignore`, if root build context changes require it
- `docker-compose.yml`
- `deploy/docker-compose.ec2.yml`
- `.github/workflows/deploy-aws.yml`
- `docs/AWS-infrastructure_setup_documentation.md`
- `docs/AWS-GITHUB-DEPLOYMENT.md`

## Production Invariants

- Public UI domains remain `https://globalscout.eu` and `https://www.globalscout.eu`.
- API calls must use `https://api.globalscout.eu/api`.
- Do not switch production browser calls to relative `/api` from the frontend domain.
- EC2 Compose still runs `ui`, `api`, `postgres`, and `migrator`.
- Production media uses private S3 with presigned upload/read URLs.
- `media.globalscout.eu` remains future/planned unless the docs and code say otherwise.

## Implementation Notes

- Build `src/ui/apps/web` with `NEXT_PUBLIC_API_BASE_URL=https://api.globalscout.eu/api`.
- If Next server route handlers read runtime env, ensure required runtime env vars are available in Compose.
- Confirm the ALB/CloudFront path behavior works with Next standalone.
- Remove legacy Vite build args from deployment once `ui` points to `src/ui/apps/web`.
- Do not force-delete `frontend/` unless explicitly requested.

## Acceptance Criteria

- Local Docker Compose runs the new `ui` service.
- AWS workflow builds and pushes the Next UI image.
- EC2 Compose uses the new UI image without changing API/postgres/migrator expectations.
- Production docs describe the Next runtime accurately.
- Legacy frontend is no longer the default deployed UI.
- Build and deployment checks pass.

## Handoff

After this stage, the new Next.js web app is the default local Docker and production UI path.
