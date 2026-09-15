using GlobalScout.Application.Abstractions.Auth;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Auth.ResendVerificationEmail;

internal sealed class ResendVerificationEmailCommandHandler(IUserIdentityStore identityStore)
    : ICommandHandler<ResendVerificationEmailCommand, ResendVerificationEmailResult>
{
    public async Task<Result<ResendVerificationEmailResult>> Handle(
        ResendVerificationEmailCommand command,
        CancellationToken cancellationToken)
    {
        var result = await identityStore.ResendVerificationEmailAsync(command.UserId, cancellationToken);
        if (result.IsFailure)
        {
            return Result.Failure<ResendVerificationEmailResult>(result.Error);
        }

        return Result.Success(new ResendVerificationEmailResult());
    }
}
