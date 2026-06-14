using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Users;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Users.Search;

internal sealed class SearchUsersQueryHandler(IUserDirectoryRepository users)
    : IQueryHandler<SearchUsersQuery, SearchUsersResult>
{
    public async Task<Result<SearchUsersResult>> Handle(SearchUsersQuery query, CancellationToken cancellationToken)
    {
        var criteria = new SearchUsersCriteria(
            query.CurrentUserId,
            query.Role,
            query.Position,
            query.Club,
            query.Country,
            query.City,
            query.MinAge,
            query.MaxAge,
            query.Search,
            query.Page < 1 ? 1 : query.Page,
            query.Limit < 1 ? 20 : Math.Min(query.Limit, 100));

        var result = await users.SearchUsersAsync(criteria, cancellationToken);
        return Result.Success(result);
    }
}
