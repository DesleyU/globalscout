# Quickstart: Validating Follow Role Restrictions

Prerequisites: local stack running (`dotnet run --project src/api/GlobalScout.AppHost`, or Docker
Compose), and at least one seeded account per role (`Player`, `ScoutAgent`, `Club`, `Admin`) — see
`docs/AGENT-ONBOARDING.md` for how test/dev accounts are provisioned in this repo. All calls below
assume an authenticated bearer token for the *follower* account and use the existing
`POST /api/follow/{userId}/follow` endpoint (see [contracts/follow-endpoint.md](contracts/follow-endpoint.md)).

## Automated validation (primary)

This feature's correctness is validated by tests, not manual API calls — run:

```bash
cd src/api
dotnet test GlobalScout.Application.UnitTests --filter "FullyQualifiedName~FollowEligibility"
dotnet test GlobalScout.Application.UnitTests --filter "FullyQualifiedName~FollowUserCommandHandler"
dotnet test GlobalScout.Api.IntegrationTests --filter "FullyQualifiedName~SocialFollowIntegrationTests"
```

Expected: all pass, including the new role-pairing cases described below.

## Manual / exploratory validation

1. **Player → Player (allowed, unchanged)**

   ```bash
   curl -X POST https://localhost:<port>/api/follow/<playerBId>/follow \
     -H "Authorization: Bearer <playerAToken>"
   ```

   Expected: `200 OK`, follow created — matches pre-existing behavior.

2. **Agent → Player (allowed, unchanged)**

   ```bash
   curl -X POST https://localhost:<port>/api/follow/<playerId>/follow \
     -H "Authorization: Bearer <agentToken>"
   ```

   Expected: `200 OK`, follow created.

3. **Player → Agent (newly disallowed)**

   ```bash
   curl -X POST https://localhost:<port>/api/follow/<agentId>/follow \
     -H "Authorization: Bearer <playerToken>"
   ```

   Expected: `400 Bad Request`, `code: "Social.FollowRestrictedToPlayers"` (or final chosen code —
   see contracts/follow-endpoint.md), with a message naming the actual rule, not a generic error.

4. **Agent → Agent (newly disallowed)**

   ```bash
   curl -X POST https://localhost:<port>/api/follow/<agentBId>/follow \
     -H "Authorization: Bearer <agentAToken>"
   ```

   Expected: `400 Bad Request`, agent-specific error code.

5. **Anyone → Admin, or Admin → anyone (newly disallowed)**

   ```bash
   curl -X POST https://localhost:<port>/api/follow/<adminId>/follow \
     -H "Authorization: Bearer <playerToken>"
   ```

   Expected: `400 Bad Request`.

6. **Existing follow relationships are untouched**

   If a Player already follows an Agent (or any now-disallowed pairing) from before this change
   shipped, confirm via `GET /api/follow/{followerId}/following` that the relationship is still
   listed, and via `POST /api/follow/{agentId}/unfollow` that it can still be removed normally.

7. **Connections are unaffected**

   Confirm `POST /api/connections/send` (or equivalent Connections endpoint) still succeeds between
   any two roles — this feature does not touch Connections.

## Success signal

All automated tests pass, and manual steps 1-2 succeed while 3-5 are rejected with role-specific
error codes/messages, with step 6-7 confirming no regression to existing data or to Connections.
