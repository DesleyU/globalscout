using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Statistics;
using GlobalScout.Application.Statistics.GetMyStats;

namespace GlobalScout.Api.Endpoints.Stats;

internal sealed class GetStatsMe : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet(
                StatsRoutes.Me,
                async (
                    ClaimsPrincipal principal,
                    IQueryHandler<GetMyPlayerStatisticsQuery, PlayerStatisticsResponseEnvelope> handler,
                    CancellationToken cancellationToken) =>
                {
                    var userId = HttpUser.ResolveId(principal);
                    if (userId is null)
                    {
                        return Results.Unauthorized();
                    }

                    var result = await handler.Handle(new GetMyPlayerStatisticsQuery(userId.Value), cancellationToken);
                    return result.Match(Results.Ok, CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("GetStatsMe")
            .WithTags(StatsEndpointTags.Stats);
    }
}
