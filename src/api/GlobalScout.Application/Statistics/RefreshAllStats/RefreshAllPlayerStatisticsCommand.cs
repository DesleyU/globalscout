using GlobalScout.Application.Abstractions.Messaging;

namespace GlobalScout.Application.Statistics.RefreshAllStats;

public sealed record RefreshAllPlayerStatisticsCommand : ICommand<RefreshAllPlayerStatisticsResult>;

