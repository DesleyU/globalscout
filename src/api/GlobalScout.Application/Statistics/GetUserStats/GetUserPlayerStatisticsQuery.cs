using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Statistics;

namespace GlobalScout.Application.Statistics.GetUserStats;

public sealed record GetUserPlayerStatisticsQuery(Guid TargetUserId, Guid RequestingUserId)
    : IQuery<PlayerStatisticsResponseEnvelope>;
