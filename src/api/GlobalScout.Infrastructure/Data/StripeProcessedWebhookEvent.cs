namespace GlobalScout.Infrastructure.Data;

/// <summary>Stores Stripe event ids for idempotent webhook handling.</summary>
public sealed class StripeProcessedWebhookEvent
{
    public string EventId { get; set; } = "";

    public DateTimeOffset ProcessedAt { get; set; }
}
