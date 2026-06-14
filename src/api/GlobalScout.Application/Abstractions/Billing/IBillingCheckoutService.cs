using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Abstractions.Billing;

public sealed record CreateCheckoutSessionResult(string SessionId, string Url);

public interface IBillingCheckoutService
{
    Task<Result<CreateCheckoutSessionResult>> CreatePremiumSubscriptionCheckoutAsync(
        Guid userId,
        string email,
        CancellationToken cancellationToken);
}
