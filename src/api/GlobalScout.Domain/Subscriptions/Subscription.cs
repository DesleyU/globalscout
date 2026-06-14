namespace GlobalScout.Domain.Subscriptions;

public sealed class Subscription
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public SubscriptionTier Tier { get; set; } = SubscriptionTier.Basic;

    public SubscriptionStatus Status { get; set; } = SubscriptionStatus.Active;

    public DateTimeOffset StartDate { get; set; }

    public DateTimeOffset? EndDate { get; set; }

    public string? PaymentId { get; set; }

    public string? StripeCustomerId { get; set; }

    public string? StripeSubscriptionId { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }
}
