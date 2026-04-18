using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Statistics;

namespace GlobalScout.Application.Statistics.GetMyStats;

public sealed record GetMyPlayerStatisticsQuery(Guid UserId) : IQuery<PlayerStatisticsResponseEnvelope>;

