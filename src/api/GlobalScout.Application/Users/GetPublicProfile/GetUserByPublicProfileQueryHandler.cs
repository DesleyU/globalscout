using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Users;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Users.GetPublicProfile;

internal sealed class GetUserByPublicProfileQueryHandler(IUserDirectoryRepository users)
    : IQueryHandler<GetUserByPublicProfileQuery, GetUserByPublicProfileResult?>
{
    public async Task<Result<GetUserByPublicProfileResult?>> Handle(
        GetUserByPublicProfileQuery query,
        CancellationToken cancellationToken)
    {
        var target = await users.GetActivePublicUserAsync(query.TargetUserId, cancellationToken);
        if (target is null)
        {
            return Result.Success<GetUserByPublicProfileResult?>(null);
        }

        if (query.ViewerUserId != query.TargetUserId)
        {
            await users.UpsertProfileVisitAsync(
                query.TargetUserId,
                query.ViewerUserId,
                query.ViewerRole,
                cancellationToken);
        }

        var filteredProfile = ProfileVisibility.ForPublicView(target.AccountTypeValue, target.Profile);

        var user = target with { Profile = filteredProfile };

        return Result.Success<GetUserByPublicProfileResult?>(new GetUserByPublicProfileResult(user));
    }
}
