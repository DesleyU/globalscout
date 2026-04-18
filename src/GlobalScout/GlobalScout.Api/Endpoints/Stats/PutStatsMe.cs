using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Statistics.UpsertMyStats;

namespace GlobalScout.Api.Endpoints.Stats;

internal sealed class PutStatsMe : IEndpoint
{
    public sealed class Request
    {
        public string Season { get; set; } = string.Empty;

        public int? Goals { get; set; }

        public int? Assists { get; set; }

        public int? Matches { get; set; }

        public int? Minutes { get; set; }

        public int? YellowCards { get; set; }

        public int? RedCards { get; set; }

        public double? Rating { get; set; }

        public int? ShotsTotal { get; set; }

        public int? ShotsOnTarget { get; set; }

        public int? PassesTotal { get; set; }

        public double? PassesAccuracy { get; set; }

        public int? TacklesTotal { get; set; }

        public int? TacklesInterceptions { get; set; }

        public int? DuelsWon { get; set; }

        public int? FoulsCommitted { get; set; }

        public int? FoulsDrawn { get; set; }
    }

    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPut(
                StatsRoutes.Me,
                async (
                    ClaimsPrincipal principal,
                    Request body,
                    ICommandHandler<UpsertMyPlayerStatisticsCommand, UpsertMyPlayerStatisticsResult> handler,
                    CancellationToken cancellationToken) =>
                {
                    var userId = HttpUser.ResolveId(principal);
                    if (userId is null)
                    {
                        return Results.Unauthorized();
                    }

                    var command = new UpsertMyPlayerStatisticsCommand
                    {
                        UserId = userId.Value,
                        Season = body.Season,
                        Goals = body.Goals,
                        Assists = body.Assists,
                        Matches = body.Matches,
                        Minutes = body.Minutes,
                        YellowCards = body.YellowCards,
                        RedCards = body.RedCards,
                        Rating = body.Rating,
                        ShotsTotal = body.ShotsTotal,
                        ShotsOnTarget = body.ShotsOnTarget,
                        PassesTotal = body.PassesTotal,
                        PassesAccuracy = body.PassesAccuracy,
                        TacklesTotal = body.TacklesTotal,
                        TacklesInterceptions = body.TacklesInterceptions,
                        DuelsWon = body.DuelsWon,
                        FoulsCommitted = body.FoulsCommitted,
                        FoulsDrawn = body.FoulsDrawn
                    };

                    var result = await handler.Handle(command, cancellationToken);
                    return result.Match(
                        r => Results.Ok(new
                        {
                            message = "Statistics updated successfully",
                            stats = r.Stats,
                            tier = r.Tier
                        }),
                        CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("PutStatsMe")
            .WithTags(StatsEndpointTags.Stats);
    }
}
