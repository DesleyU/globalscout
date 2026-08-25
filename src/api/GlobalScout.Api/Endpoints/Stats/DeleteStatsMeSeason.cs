using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Statistics.DeleteMySeason;

namespace GlobalScout.Api.Endpoints.Stats;

internal sealed class DeleteStatsMeSeason : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapDelete(
                StatsRoutes.MeSeason,
                async (
                    ClaimsPrincipal principal,
                    string season,
                    ICommandHandler<DeleteMyPlayerStatisticsCommand, DeleteMyPlayerStatisticsResult> handler,
                    CancellationToken cancellationToken) =>
                {
                    var userId = HttpUser.ResolveId(principal);
                    if (userId is null)
                    {
                        return Results.Unauthorized();
                    }

                    var result = await handler.Handle(
                        new DeleteMyPlayerStatisticsCommand(userId.Value, season),
                        cancellationToken);

                    return result.Match(
                        r => Results.Ok(new { message = r.Message }),
                        CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("DeleteStatsMeSeason")
            .WithTags(StatsEndpointTags.Stats);
    }
}
