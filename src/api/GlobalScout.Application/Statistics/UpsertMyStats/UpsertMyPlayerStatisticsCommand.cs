using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Persistence;

namespace GlobalScout.Application.Statistics.UpsertMyStats;

public sealed class UpsertMyPlayerStatisticsCommand : ICommand<UpsertMyPlayerStatisticsResult>
{
    public Guid UserId { get; init; }

    public string Season { get; init; } = string.Empty;

    public IReadOnlyList<ManualCompetitionInput> Competitions { get; init; } = [];

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
