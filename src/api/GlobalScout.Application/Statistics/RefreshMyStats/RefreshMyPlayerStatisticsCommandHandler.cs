using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Statistics.RefreshMyStats;

internal sealed class RefreshMyPlayerStatisticsCommandHandler(IPlayerStatisticsRefreshExecutor executor)
    : ICommandHandler<RefreshMyPlayerStatisticsCommand, RefreshMyPlayerStatisticsResult>
{
    public Task<Result<RefreshMyPlayerStatisticsResult>> Handle(
        RefreshMyPlayerStatisticsCommand command,
        CancellationToken cancellationToken) =>
        executor.ExecuteAsync(command.UserId, cancellationToken);
}
