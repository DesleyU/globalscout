using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Statistics.RefreshMyStats;

namespace GlobalScout.Api.Endpoints.Stats;

internal sealed class PostStatsRefresh : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost(
                StatsRoutes.Refresh,
                async (
                    ClaimsPrincipal principal,
                    ICommandHandler<RefreshMyPlayerStatisticsCommand, RefreshMyPlayerStatisticsResult> handler,
                    CancellationToken cancellationToken) =>
                {
                    var userId = HttpUser.ResolveId(principal);
                    if (userId is null)
                    {
                        return Results.Unauthorized();
                    }

                    var result = await handler.Handle(new RefreshMyPlayerStatisticsCommand(userId.Value), cancellationToken);
                    return result.Match(
                        r => Results.Ok(new
                        {
                            success = r.Success,
                            message = r.Message,
                            data = r.Data
                        }),
                        CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("PostStatsRefresh")
            .WithTags(StatsEndpointTags.Stats);
    }
}
