using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Users;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Users.Recommendations;

internal sealed class GetUserRecommendationsQueryHandler(IUserDirectoryRepository users)
    : IQueryHandler<GetUserRecommendationsQuery, GetUserRecommendationsResult>
{
    public async Task<Result<GetUserRecommendationsResult>> Handle(
        GetUserRecommendationsQuery query,
        CancellationToken cancellationToken)
    {
        var limit = query.Limit < 1 ? 10 : Math.Min(query.Limit, 50);
        var items = await users.GetRecommendationsAsync(
            query.CurrentUserId,
            query.CurrentRole,
            limit,
            cancellationToken);

        return Result.Success(new GetUserRecommendationsResult(items));
    }
}
