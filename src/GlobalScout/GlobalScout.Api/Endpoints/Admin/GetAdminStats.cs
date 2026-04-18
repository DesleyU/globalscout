using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Admin.GetSystemStats;
using GlobalScout.Application.Authorization;
using GlobalScout.SharedKernel;

namespace GlobalScout.Api.Endpoints.Admin;

internal sealed class GetAdminStats : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet(
                AdminRoutes.Stats,
                async (
                    ClaimsPrincipal principal,
                    IQueryHandler<GetAdminSystemStatsQuery, AdminSystemStatsResult> handler,
                    CancellationToken cancellationToken) =>
                {
                    if (HttpUser.ResolveId(principal) is null)
                    {
                        return Results.Unauthorized();
                    }

                    var result = await handler.Handle(new GetAdminSystemStatsQuery(), cancellationToken);
                    return result.Match(
                        r => Results.Ok(new { stats = r.Stats }),
                        CustomResults.Problem);
                })
            .RequireAuthorization(AuthorizationPolicyNames.Admin)
            .WithName("AdminSystemStats")
            .WithTags(AdminEndpointTags.Admin);
    }
}
