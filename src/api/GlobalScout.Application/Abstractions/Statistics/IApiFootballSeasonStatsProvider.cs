using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Abstractions.Statistics;

public interface IApiFootballSeasonStatsProvider
{
    Task<Result<AggregatedFootballSeasonStats>> GetAggregatedAsync(
        int apiPlayerId,
        int seasonYear,
        CancellationToken cancellationToken);
}
