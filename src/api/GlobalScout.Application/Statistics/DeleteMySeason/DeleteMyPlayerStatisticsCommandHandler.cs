using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Statistics.DeleteMySeason;

internal sealed class DeleteMyPlayerStatisticsCommandHandler(IPlayerStatisticsRepository stats)
    : ICommandHandler<DeleteMyPlayerStatisticsCommand, DeleteMyPlayerStatisticsResult>
{
    public async Task<Result<DeleteMyPlayerStatisticsResult>> Handle(
        DeleteMyPlayerStatisticsCommand command,
        CancellationToken cancellationToken)
    {
        var deleted = await stats.DeleteManualAsync(command.UserId, command.Season, cancellationToken);
        if (!deleted)
        {
            return Result.Failure<DeleteMyPlayerStatisticsResult>(StatsErrors.ManualSeasonNotFound);
        }

        return Result.Success(new DeleteMyPlayerStatisticsResult("Season statistics deleted."));
    }
}
