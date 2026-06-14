using GlobalScout.Application.Abstractions.Auth;
using GlobalScout.Application.Abstractions.Billing;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Account;
using GlobalScout.Domain.Identity;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Billing.CreateCheckoutSession;

internal sealed class CreateCheckoutSessionCommandHandler(
    IUserIdentityStore identityStore,
    IBillingCheckoutService checkoutService)
    : ICommandHandler<CreateCheckoutSessionCommand, CreateCheckoutSessionResult>
{
    public async Task<Result<CreateCheckoutSessionResult>> Handle(
        CreateCheckoutSessionCommand command,
        CancellationToken cancellationToken)
    {
        var summary = await identityStore.GetAccountSummaryAsync(command.UserId, cancellationToken);
        if (summary is null)
        {
            return Result.Failure<CreateCheckoutSessionResult>(AccountErrors.UserNotFound);
        }

        if (summary.AccountType == AccountType.Premium)
        {
            return Result.Failure<CreateCheckoutSessionResult>(BillingErrors.AlreadyPremium);
        }

        return await checkoutService.CreatePremiumSubscriptionCheckoutAsync(
            command.UserId,
            summary.Email,
            cancellationToken);
    }
}
