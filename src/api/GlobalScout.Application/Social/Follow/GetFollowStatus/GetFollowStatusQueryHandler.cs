using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Social;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Social.Follow.GetFollowStatus;

internal sealed class GetFollowStatusQueryHandler(ISocialGraphRepository social)
    : IQueryHandler<GetFollowStatusQuery, GetFollowStatusResult>
{
    public async Task<Result<GetFollowStatusResult>> Handle(
        GetFollowStatusQuery query,
        CancellationToken cancellationToken)
    {
        var (isFollowing, followId) =
            await social.GetFollowStatusAsync(query.FollowerId, query.FollowingUserId, cancellationToken);
        return Result.Success(new GetFollowStatusResult(isFollowing, followId));
    }
}
