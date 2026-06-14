using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Users;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Users.GetProfile;

internal sealed class GetUsersProfileQueryHandler(IUserDirectoryRepository users)
    : IQueryHandler<GetUsersProfileQuery, UsersFullProfileResult?>
{
    public async Task<Result<UsersFullProfileResult?>> Handle(
        GetUsersProfileQuery query,
        CancellationToken cancellationToken)
    {
        var user = await users.GetFullProfileAsync(query.UserId, cancellationToken);
        return Result.Success(user);
    }
}
