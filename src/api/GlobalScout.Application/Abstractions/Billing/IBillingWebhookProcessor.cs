using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Abstractions.Billing;

/// <summary>Verifies Stripe webhook signatures and applies subscription state to the database.</summary>
public interface IBillingWebhookProcessor
{
    Task<Result> ProcessAsync(string jsonBody, string stripeSignatureHeader, CancellationToken cancellationToken);
}
