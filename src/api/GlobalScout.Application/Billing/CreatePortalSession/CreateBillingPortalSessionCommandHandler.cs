using GlobalScout.Application.Abstractions.Auth;
using GlobalScout.Application.Abstractions.Billing;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Account;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Billing.CreatePortalSession;

internal sealed class CreateBillingPortalSessionCommandHandler(
    IUserIdentityStore identityStore,
    IBillingPortalService portalService)
    : ICommandHandler<CreateBillingPortalSessionCommand, CreateBillingPortalSessionResult>
{
    public async Task<Result<CreateBillingPortalSessionResult>> Handle(
        CreateBillingPortalSessionCommand command,
        CancellationToken cancellationToken)
    {
        var summary = await identityStore.GetAccountSummaryAsync(command.UserId, cancellationToken);
        if (summary is null)
        {
            return Result.Failure<CreateBillingPortalSessionResult>(AccountErrors.UserNotFound);
        }

        var customerId = await identityStore.GetStripeCustomerIdAsync(command.UserId, cancellationToken);
        if (string.IsNullOrWhiteSpace(customerId))
        {
            return Result.Failure<CreateBillingPortalSessionResult>(BillingErrors.NoStripeCustomer);
        }

        return await portalService.CreateCustomerPortalSessionAsync(customerId, cancellationToken);
    }
}
