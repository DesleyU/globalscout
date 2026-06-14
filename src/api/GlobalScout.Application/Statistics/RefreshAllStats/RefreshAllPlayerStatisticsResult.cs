namespace GlobalScout.Application.Statistics.RefreshAllStats;

public sealed record RefreshAllPlayerStatisticsResult(
    bool Success,
    string Message,
    object Data);
