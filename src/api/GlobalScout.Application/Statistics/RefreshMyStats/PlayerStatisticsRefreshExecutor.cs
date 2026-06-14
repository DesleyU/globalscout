using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Abstractions.Statistics;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Statistics.RefreshMyStats;

internal sealed class PlayerStatisticsRefreshExecutor(
    IPlayerStatisticsRepository stats,
    IApiFootballSeasonStatsProvider football,
    IStatisticsUpdateState updateState) : IPlayerStatisticsRefreshExecutor
{
    public async Task<Result<RefreshMyPlayerStatisticsResult>> ExecuteAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        if (!updateState.TryBeginUserRefresh(userId))
        {
            return Result.Failure<RefreshMyPlayerStatisticsResult>(StatsErrors.RefreshInProgress);
        }

        try
        {
            if (!await stats.UserExistsAsync(userId, cancellationToken))
            {
                return Result.Failure<RefreshMyPlayerStatisticsResult>(StatsErrors.UserNotFound);
            }

            var playerId = await stats.GetApiPlayerIdAsync(userId, cancellationToken);
            if (playerId is null)
            {
                return Result.Failure<RefreshMyPlayerStatisticsResult>(StatsErrors.NoPlayerId);
            }

            var seasonYear = DateTime.UtcNow.Year;
            var external = await football.GetAggregatedAsync(playerId.Value, seasonYear, cancellationToken);
            if (external.IsFailure)
            {
                return Result.Failure<RefreshMyPlayerStatisticsResult>(external.Error);
            }

            await stats.UpsertApiFootballAndReturnAsync(userId, external.Value, cancellationToken);
            var utc = DateTimeOffset.UtcNow;
            updateState.SetLastUpdate(utc);

            return Result.Success(
                new RefreshMyPlayerStatisticsResult(
                    true,
                    "Statistics refreshed successfully",
                    new
                    {
                        statisticsCount = 1,
                        lastUpdate = utc
                    }));
        }
        finally
        {
            updateState.EndUserRefresh(userId);
        }
    }
}
