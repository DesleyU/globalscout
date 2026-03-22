using GlobalScout.Application.Abstractions.Auth;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Auth.Login;

internal sealed class LoginUserCommandHandler(
    IUserIdentityStore identityStore,
    IJwtTokenIssuer jwtTokenIssuer) : ICommandHandler<LoginUserCommand, LoginUserResult>
{
    public async Task<Result<LoginUserResult>> Handle(LoginUserCommand command, CancellationToken cancellationToken)
    {
        var login = await identityStore.ValidateLoginAsync(command, cancellationToken);
        if (login.IsFailure)
        {
            return Result.Failure<LoginUserResult>(login.Error);
        }

        var o = login.Value;
        var token = jwtTokenIssuer.IssueAccessToken(o.UserId, o.Email, o.Role);
        var profile = new LoginUserProfileDto(
            o.Profile.FirstName,
            o.Profile.LastName,
            o.Profile.Position,
            o.Profile.Age,
            o.Profile.ClubName);

        return Result.Success(new LoginUserResult(o.UserId, o.Email, o.Role, token, o.AccountType, profile));
    }
}
