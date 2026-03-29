using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Social;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Social.FollowLists;

internal sealed class GetFollowStatsQueryHandler(ISocialGraphRepository social)
    : IQueryHandler<GetFollowStatsQuery, GetFollowStatsResult>
{
    public async Task<Result<GetFollowStatsResult>> Handle(
        GetFollowStatsQuery query,
        CancellationToken cancellationToken)
    {
        var (followers, following) = await social.GetFollowCountsAsync(query.UserId, cancellationToken);
        return Result.Success(new GetFollowStatsResult(followers, following));
    }
}
