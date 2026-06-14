using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Social;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Social.Follow.GetFollowers;

internal sealed class GetFollowersQueryHandler(ISocialGraphRepository social)
    : IQueryHandler<GetFollowersQuery, GetFollowListResult>
{
    public async Task<Result<GetFollowListResult>> Handle(GetFollowersQuery query, CancellationToken cancellationToken)
    {
        var page = Math.Max(1, query.Page);
        var limit = Math.Clamp(query.Limit, 1, 100);

        var (items, total) = await social.GetFollowersPageAsync(query.UserId, page, limit, cancellationToken);
        var pages = (int)Math.Ceiling(total / (double)limit);
        return Result.Success(new GetFollowListResult(items, new LegacyPaginationDto(page, limit, total, pages)));
    }
}
