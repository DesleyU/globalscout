using GlobalScout.Application.Abstractions.Auth;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Auth.Register;

internal sealed class RegisterUserCommandHandler(
    IUserIdentityStore identityStore,
    IJwtTokenIssuer jwtTokenIssuer) : ICommandHandler<RegisterUserCommand, RegisterUserResult>
{
    public async Task<Result<RegisterUserResult>> Handle(RegisterUserCommand command, CancellationToken cancellationToken)
    {
        var created = await identityStore.RegisterAsync(command, cancellationToken);
        if (created.IsFailure)
        {
            return Result.Failure<RegisterUserResult>(created.Error);
        }

        var o = created.Value;
        var token = jwtTokenIssuer.IssueAccessToken(o.UserId, o.Email, o.Role);
        var profile = new RegisterUserProfileDto(
            o.Profile.FirstName,
            o.Profile.LastName,
            o.Profile.Position,
            o.Profile.Age,
            o.Profile.ClubName);

        return Result.Success(new RegisterUserResult(o.UserId, o.Email, o.Role, token, profile));
    }
}
