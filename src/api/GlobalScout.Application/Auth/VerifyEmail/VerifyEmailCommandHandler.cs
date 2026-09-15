using GlobalScout.Application.Abstractions.Auth;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Auth.VerifyEmail;

internal sealed class VerifyEmailCommandHandler(IUserIdentityStore identityStore)
    : ICommandHandler<VerifyEmailCommand, VerifyEmailResult>
{
    public async Task<Result<VerifyEmailResult>> Handle(VerifyEmailCommand command, CancellationToken cancellationToken)
    {
        var outcome = await identityStore.VerifyEmailAsync(command.Token, cancellationToken);
        if (outcome.IsFailure)
        {
            return Result.Failure<VerifyEmailResult>(outcome.Error);
        }

        var alreadyVerified = outcome.Value == VerifyEmailOutcome.AlreadyVerified;
        return Result.Success(new VerifyEmailResult(alreadyVerified));
    }
}
