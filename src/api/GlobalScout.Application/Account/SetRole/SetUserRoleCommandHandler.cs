using GlobalScout.Application.Abstractions.Auth;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Account.SetRole;

internal sealed class SetUserRoleCommandHandler(
    IUserIdentityStore identityStore,
    IJwtTokenIssuer jwtTokenIssuer) : ICommandHandler<SetUserRoleCommand, SetUserRoleResult>
{
    public async Task<Result<SetUserRoleResult>> Handle(
        SetUserRoleCommand command,
        CancellationToken cancellationToken)
    {
        var updated = await identityStore.SetRoleAsync(command.UserId, command.NewRole, cancellationToken);
        if (updated.IsFailure)
        {
            return Result.Failure<SetUserRoleResult>(updated.Error);
        }

        var outcome = updated.Value;
        var token = jwtTokenIssuer.IssueAccessToken(outcome.UserId, outcome.Email, outcome.NewRole);

        return Result.Success(new SetUserRoleResult(
            outcome.UserId,
            outcome.Email,
            outcome.NewRole,
            token,
            outcome.Profile));
    }
}
