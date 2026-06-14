using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Statistics;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Statistics.GetUpdateStatus;

internal sealed class GetStatisticsUpdateStatusQueryHandler(IStatisticsUpdateState state)
    : IQueryHandler<GetStatisticsUpdateStatusQuery, StatisticsUpdateStatusDto>
{
    public Task<Result<StatisticsUpdateStatusDto>> Handle(
        GetStatisticsUpdateStatusQuery query,
        CancellationToken cancellationToken)
    {
        _ = query;
        return Task.FromResult(Result.Success(state.GetStatus()));
    }
}
