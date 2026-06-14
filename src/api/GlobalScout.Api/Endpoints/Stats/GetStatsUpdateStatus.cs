using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Statistics;
using GlobalScout.Application.Statistics.GetUpdateStatus;

namespace GlobalScout.Api.Endpoints.Stats;

internal sealed class GetStatsUpdateStatus : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet(
                StatsRoutes.UpdateStatus,
                async (
                    ClaimsPrincipal principal,
                    IQueryHandler<GetStatisticsUpdateStatusQuery, StatisticsUpdateStatusDto> handler,
                    CancellationToken cancellationToken) =>
                {
                    if (HttpUser.ResolveId(principal) is null)
                    {
                        return Results.Unauthorized();
                    }

                    var result = await handler.Handle(new GetStatisticsUpdateStatusQuery(), cancellationToken);
                    return result.Match(
                        s => Results.Ok(new
                        {
                            success = true,
                            status = new
                            {
                                isUpdating = s.IsBulkUpdating || s.QueueSize > 0,
                                lastUpdate = s.LastUpdate,
                                queueSize = s.QueueSize,
                                usersInQueue = s.UsersInQueue
                            }
                        }),
                        CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("GetStatsUpdateStatus")
            .WithTags(StatsEndpointTags.Stats);
    }
}
