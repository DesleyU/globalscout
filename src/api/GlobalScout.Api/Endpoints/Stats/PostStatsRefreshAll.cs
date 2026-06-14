using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Authorization;
using GlobalScout.Application.Statistics.RefreshAllStats;

namespace GlobalScout.Api.Endpoints.Stats;

internal sealed class PostStatsRefreshAll : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost(
                StatsRoutes.RefreshAll,
                async (
                    ClaimsPrincipal principal,
                    ICommandHandler<RefreshAllPlayerStatisticsCommand, RefreshAllPlayerStatisticsResult> handler,
                    CancellationToken cancellationToken) =>
                {
                    if (HttpUser.ResolveId(principal) is null)
                    {
                        return Results.Unauthorized();
                    }

                    var result = await handler.Handle(new RefreshAllPlayerStatisticsCommand(), cancellationToken);
                    return result.Match(
                        r => Results.Ok(new
                        {
                            success = r.Success,
                            message = r.Message,
                            data = r.Data
                        }),
                        CustomResults.Problem);
                })
            .RequireAuthorization(AuthorizationPolicyNames.Admin)
            .WithName("PostStatsRefreshAll")
            .WithTags(StatsEndpointTags.Stats);
    }
}
