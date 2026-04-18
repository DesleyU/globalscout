namespace GlobalScout.Application.Statistics.UpsertMyStats;

public sealed record UpsertMyPlayerStatisticsResult(
    IReadOnlyDictionary<string, object?> Stats,
    string Tier);
