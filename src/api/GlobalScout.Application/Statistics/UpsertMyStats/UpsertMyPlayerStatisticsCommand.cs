using GlobalScout.Application.Abstractions.Messaging;

namespace GlobalScout.Application.Statistics.UpsertMyStats;

public sealed class UpsertMyPlayerStatisticsCommand : ICommand<UpsertMyPlayerStatisticsResult>
{
    public Guid UserId { get; init; }

    public string Season { get; init; } = string.Empty;

    public int? Goals { get; init; }

    public int? Assists { get; init; }

    public int? Matches { get; init; }

    public int? Minutes { get; init; }

    public int? YellowCards { get; init; }

    public int? RedCards { get; init; }

    public double? Rating { get; init; }

    public int? ShotsTotal { get; init; }

    public int? ShotsOnTarget { get; init; }

    public int? PassesTotal { get; init; }

    public double? PassesAccuracy { get; init; }

    public int? TacklesTotal { get; init; }

    public int? TacklesInterceptions { get; init; }

    public int? DuelsWon { get; init; }

    public int? FoulsCommitted { get; init; }

    public int? FoulsDrawn { get; init; }
}
