namespace GlobalScout.Application.Statistics.RefreshMyStats;

public sealed record RefreshMyPlayerStatisticsResult(
    bool Success,
    string Message,
    object? Data);
