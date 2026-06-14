using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Abstractions.Statistics;
using GlobalScout.Application.Statistics.RefreshMyStats;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Statistics.RefreshAllStats;

internal sealed class RefreshAllPlayerStatisticsCommandHandler(
    IPlayerStatisticsRepository stats,
    IPlayerStatisticsRefreshExecutor refreshOne,
    IStatisticsUpdateState updateState)
    : ICommandHandler<RefreshAllPlayerStatisticsCommand, RefreshAllPlayerStatisticsResult>
{
    public async Task<Result<RefreshAllPlayerStatisticsResult>> Handle(
        RefreshAllPlayerStatisticsCommand command,
        CancellationToken cancellationToken)
    {
        _ = command;
        if (!updateState.TryBeginBulkRefresh())
        {
            return Result.Failure<RefreshAllPlayerStatisticsResult>(StatsErrors.BulkRefreshInProgress);
        }

        try
        {
            var userIds = await stats.GetUserIdsWithApiPlayerIdAsync(cancellationToken);
            var results = new List<object>();
            var successCount = 0;
            var errorCount = 0;
            foreach (var userId in userIds)
            {
                var r = await refreshOne.ExecuteAsync(userId, cancellationToken);
                if (r.IsSuccess && r.Value.Success)
                {
                    successCount++;
                    results.Add(new { userId, success = true, message = r.Value.Message });
                }
                else
                {
                    errorCount++;
                    results.Add(new
                    {
                        userId,
                        success = false,
                        message = r.IsFailure ? r.Error.Description : r.Value.Message
                    });
                }

                await Task.Delay(1000, cancellationToken);
            }

            var last = DateTimeOffset.UtcNow;
            updateState.SetLastUpdate(last);

            return Result.Success(
                new RefreshAllPlayerStatisticsResult(
                    true,
                    $"Bulk update completed. {successCount} successful, {errorCount} failed.",
                    new
                    {
                        totalUsers = userIds.Count,
                        successCount,
                        errorCount,
                        results,
                        lastUpdate = last
                    }));
        }
        finally
        {
            updateState.EndBulkRefresh();
        }
    }
}
