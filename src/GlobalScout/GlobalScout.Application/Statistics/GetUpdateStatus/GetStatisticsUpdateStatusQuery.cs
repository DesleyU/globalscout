using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Statistics;

namespace GlobalScout.Application.Statistics.GetUpdateStatus;

public sealed record GetStatisticsUpdateStatusQuery : IQuery<StatisticsUpdateStatusDto>;

