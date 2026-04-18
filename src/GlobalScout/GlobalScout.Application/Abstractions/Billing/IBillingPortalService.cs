using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Abstractions.Billing;

public sealed record CreateBillingPortalSessionResult(string Url);

public interface IBillingPortalService
{
    Task<Result<CreateBillingPortalSessionResult>> CreateCustomerPortalSessionAsync(
        string stripeCustomerId,
        CancellationToken cancellationToken);
}
