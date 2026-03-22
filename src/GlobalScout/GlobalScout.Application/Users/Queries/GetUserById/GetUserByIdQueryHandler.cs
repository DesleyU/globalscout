using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Users.Queries.GetUserById;

internal sealed class GetUserByIdQueryHandler(IUserRepository users)
    : IQueryHandler<GetUserByIdQuery, GetUserByIdResult?>
{
    public async Task<Result<GetUserByIdResult?>> Handle(GetUserByIdQuery query, CancellationToken cancellationToken)
    {
        var u = await users.GetByIdAsync(query.UserId, cancellationToken);
        if (u is null)
        {
            return Result.Success<GetUserByIdResult?>(null);
        }

        return Result.Success<GetUserByIdResult?>(new GetUserByIdResult(u.Id, u.Email, u.Role, u.Status, u.AccountType));
    }
}
