using GlobalScout.Application.Abstractions.Messaging;

namespace GlobalScout.Application.Statistics.RefreshMyStats;

public sealed record RefreshMyPlayerStatisticsCommand(Guid UserId) : ICommand<RefreshMyPlayerStatisticsResult>;
