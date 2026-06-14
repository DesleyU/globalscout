using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Statistics.RefreshMyStats;

public interface IPlayerStatisticsRefreshExecutor
{
    Task<Result<RefreshMyPlayerStatisticsResult>> ExecuteAsync(
        Guid userId,
        CancellationToken cancellationToken);
}
