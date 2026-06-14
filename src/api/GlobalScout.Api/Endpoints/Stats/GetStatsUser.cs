using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Statistics;
using GlobalScout.Application.Statistics.GetUserStats;

namespace GlobalScout.Api.Endpoints.Stats;

internal sealed class GetStatsUser : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet(
                StatsRoutes.User,
                async (
                    Guid userId,
                    ClaimsPrincipal principal,
                    IQueryHandler<GetUserPlayerStatisticsQuery, PlayerStatisticsResponseEnvelope> handler,
                    CancellationToken cancellationToken) =>
                {
                    var requester = HttpUser.ResolveId(principal);
                    if (requester is null)
                    {
                        return Results.Unauthorized();
                    }

                    var result = await handler.Handle(
                        new GetUserPlayerStatisticsQuery(userId, requester.Value),
                        cancellationToken);
                    return result.Match(Results.Ok, CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("GetStatsUser")
            .WithTags(StatsEndpointTags.Stats);
    }
}
