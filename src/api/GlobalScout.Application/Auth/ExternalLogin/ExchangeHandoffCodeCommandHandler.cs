using GlobalScout.Application.Abstractions.Auth;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Auth.ExternalLogin;

internal sealed class ExchangeHandoffCodeCommandHandler(
    IHandoffCodeStore handoffCodeStore,
    IUserIdentityStore identityStore,
    IJwtTokenIssuer jwtTokenIssuer) : ICommandHandler<ExchangeHandoffCodeCommand, ExchangeHandoffCodeResult>
{
    public async Task<Result<ExchangeHandoffCodeResult>> Handle(
        ExchangeHandoffCodeCommand command,
        CancellationToken cancellationToken)
    {
        if (!handoffCodeStore.TryConsume(command.Code, out var userId))
        {
            return Result.Failure<ExchangeHandoffCodeResult>(ExternalLoginErrors.InvalidHandoffCode);
        }

        var profileResult = await identityStore.GetProfileAsync(userId, cancellationToken);
        if (profileResult.IsFailure || profileResult.Value is null)
        {
            return Result.Failure<ExchangeHandoffCodeResult>(AuthErrors.UserNotFound);
        }

        var p = profileResult.Value;
        var token = jwtTokenIssuer.IssueAccessToken(p.Id, p.Email, p.Role);
        var profile = new ExchangeHandoffCodeProfileDto(
            p.Profile.FirstName,
            p.Profile.LastName,
            p.Profile.Position,
            p.Profile.Age,
            p.Profile.ClubName);

        return Result.Success(new ExchangeHandoffCodeResult(p.Id, p.Email, p.Role, token, profile));
    }
}
