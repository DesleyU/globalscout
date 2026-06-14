using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Admin.GetSystemStats;

internal sealed class GetAdminSystemStatsQueryHandler(IAdminRepository admin)
    : IQueryHandler<GetAdminSystemStatsQuery, AdminSystemStatsResult>
{
    public async Task<Result<AdminSystemStatsResult>> Handle(
        GetAdminSystemStatsQuery query,
        CancellationToken cancellationToken)
    {
        var stats = await admin.GetSystemStatsAsync(cancellationToken);
        return Result.Success(stats);
    }
}
