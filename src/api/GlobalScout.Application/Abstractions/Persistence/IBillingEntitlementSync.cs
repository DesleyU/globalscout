namespace GlobalScout.Application.Abstractions.Persistence;

/// <summary>Persists Stripe-driven subscription state and webhook idempotency.</summary>
public interface IBillingEntitlementSync
{
    Task<bool> IsStripeWebhookEventProcessedAsync(string eventId, CancellationToken cancellationToken);

    Task RecordStripeWebhookEventAsync(string eventId, CancellationToken cancellationToken);

    Task SyncPremiumFromCheckoutAsync(
        Guid userId,
        string stripeCustomerId,
        string stripeSubscriptionId,
        CancellationToken cancellationToken);

    Task SyncFromStripeSubscriptionAsync(
        string stripeSubscriptionId,
        string stripeCustomerId,
        string stripeStatus,
        DateTimeOffset? currentPeriodEnd,
        CancellationToken cancellationToken);

    Task RevokePremiumByStripeSubscriptionIdAsync(string stripeSubscriptionId, CancellationToken cancellationToken);
}
