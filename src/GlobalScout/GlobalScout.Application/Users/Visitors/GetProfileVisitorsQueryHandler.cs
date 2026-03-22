using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Users;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Users.Visitors;

internal sealed class GetProfileVisitorsQueryHandler(IUserDirectoryRepository users)
    : IQueryHandler<GetProfileVisitorsQuery, GetProfileVisitorsResult>
{
    public async Task<Result<GetProfileVisitorsResult>> Handle(
        GetProfileVisitorsQuery query,
        CancellationToken cancellationToken)
    {
        var owner = await users.GetFullProfileAsync(query.ProfileOwnerId, cancellationToken);
        if (owner is null)
        {
            return Result.Failure<GetProfileVisitorsResult>(UsersErrors.UserNotFound);
        }

        var premium = string.Equals(owner.AccountType, "PREMIUM", StringComparison.OrdinalIgnoreCase);
        var result = await users.GetProfileVisitorsAsync(query.ProfileOwnerId, premium, cancellationToken);
        return Result.Success(result);
    }
}
