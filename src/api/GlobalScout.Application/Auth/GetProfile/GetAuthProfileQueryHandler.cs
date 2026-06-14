using GlobalScout.Application.Abstractions.Auth;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.SharedKernel;

using static GlobalScout.Application.Auth.AuthErrors;

namespace GlobalScout.Application.Auth.GetProfile;

internal sealed class GetAuthProfileQueryHandler(IUserIdentityStore identityStore)
    : IQueryHandler<GetAuthProfileQuery, GetAuthProfileResult>
{
    public async Task<Result<GetAuthProfileResult>> Handle(GetAuthProfileQuery query, CancellationToken cancellationToken)
    {
        var profile = await identityStore.GetProfileAsync(query.UserId, cancellationToken);
        if (profile.IsFailure)
        {
            return Result.Failure<GetAuthProfileResult>(profile.Error);
        }

        if (profile.Value is null)
        {
            return Result.Failure<GetAuthProfileResult>(UserNotFound);
        }

        return Result.Success(profile.Value);
    }
}
