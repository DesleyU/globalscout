using GlobalScout.Application.Abstractions.Auth;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Domain.Identity;
using GlobalScout.Domain.Subscriptions;
using GlobalScout.Infrastructure.Data;
using GlobalScout.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GlobalScout.Infrastructure.Billing;

internal sealed class BillingEntitlementSync(
    GlobalScoutDbContext db,
    UserManager<ApplicationUser> userManager,
    IUserIdentityStore identityStore,
    ILogger<BillingEntitlementSync> logger) : IBillingEntitlementSync
{
    public Task<bool> IsStripeWebhookEventProcessedAsync(string eventId, CancellationToken cancellationToken) =>
        db.StripeProcessedWebhookEvents.AnyAsync(e => e.EventId == eventId, cancellationToken);

    public async Task RecordStripeWebhookEventAsync(string eventId, CancellationToken cancellationToken)
    {
        if (await db.StripeProcessedWebhookEvents.AnyAsync(e => e.EventId == eventId, cancellationToken))
        {
            return;
        }

        db.StripeProcessedWebhookEvents.Add(new StripeProcessedWebhookEvent
        {
            EventId = eventId,
            ProcessedAt = DateTimeOffset.UtcNow
        });

        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex)
        {
            logger.LogDebug(ex, "Stripe webhook event {EventId} already recorded (race)", eventId);
        }
    }

    public async Task SyncPremiumFromCheckoutAsync(
        Guid userId,
        string stripeCustomerId,
        string stripeSubscriptionId,
        CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null)
        {
            logger.LogWarning("Stripe checkout completed for unknown user {UserId}", userId);
            return;
        }

        user.StripeCustomerId = stripeCustomerId;
        user.UpdatedAt = DateTimeOffset.UtcNow;
        await userManager.UpdateAsync(user);

        await UpsertSubscriptionAsync(
            userId,
            stripeCustomerId,
            stripeSubscriptionId,
            SubscriptionTier.Premium,
            SubscriptionStatus.Active,
            periodEnd: null,
            cancellationToken);

        await identityStore.SetAccountTierFromBillingAsync(userId, AccountType.Premium, cancellationToken);
    }

    public async Task SyncFromStripeSubscriptionAsync(
        string stripeSubscriptionId,
        string stripeCustomerId,
        string stripeStatus,
        DateTimeOffset? currentPeriodEnd,
        CancellationToken cancellationToken)
    {
        var sub = await db.Subscriptions.AsTracking()
            .FirstOrDefaultAsync(s => s.StripeSubscriptionId == stripeSubscriptionId, cancellationToken);

        if (sub is null)
        {
            logger.LogWarning("Stripe subscription {SubId} not found locally", stripeSubscriptionId);
            return;
        }

        var (tier, status, accountType) = MapStripeStatus(stripeStatus);
        sub.StripeCustomerId = stripeCustomerId;
        sub.StripeSubscriptionId = stripeSubscriptionId;
        sub.Tier = tier;
        sub.Status = status;
        sub.EndDate = currentPeriodEnd;
        sub.UpdatedAt = DateTimeOffset.UtcNow;

        var user = await userManager.FindByIdAsync(sub.UserId.ToString());
        if (user is not null && !string.IsNullOrWhiteSpace(stripeCustomerId))
        {
            user.StripeCustomerId = stripeCustomerId;
            user.UpdatedAt = DateTimeOffset.UtcNow;
            await userManager.UpdateAsync(user);
        }

        await db.SaveChangesAsync(cancellationToken);

        await identityStore.SetAccountTierFromBillingAsync(sub.UserId, accountType, cancellationToken);
    }

    public async Task RevokePremiumByStripeSubscriptionIdAsync(
        string stripeSubscriptionId,
        CancellationToken cancellationToken)
    {
        var sub = await db.Subscriptions.AsTracking()
            .FirstOrDefaultAsync(s => s.StripeSubscriptionId == stripeSubscriptionId, cancellationToken);

        if (sub is null)
        {
            return;
        }

        sub.Status = SubscriptionStatus.Cancelled;
        sub.Tier = SubscriptionTier.Basic;
        sub.EndDate = DateTimeOffset.UtcNow;
        sub.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync(cancellationToken);

        await identityStore.SetAccountTierFromBillingAsync(sub.UserId, AccountType.Basic, cancellationToken);
    }

    private async Task UpsertSubscriptionAsync(
        Guid userId,
        string stripeCustomerId,
        string stripeSubscriptionId,
        SubscriptionTier tier,
        SubscriptionStatus status,
        DateTimeOffset? periodEnd,
        CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var sub = await db.Subscriptions.AsTracking()
            .FirstOrDefaultAsync(s => s.UserId == userId, cancellationToken);

        if (sub is null)
        {
            sub = new Subscription
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                CreatedAt = now,
                UpdatedAt = now,
                StartDate = now
            };
            db.Subscriptions.Add(sub);
        }

        sub.StripeCustomerId = stripeCustomerId;
        sub.StripeSubscriptionId = stripeSubscriptionId;
        sub.Tier = tier;
        sub.Status = status;
        sub.EndDate = periodEnd;
        sub.UpdatedAt = now;
        if (sub.StartDate == default)
        {
            sub.StartDate = now;
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    private static (SubscriptionTier Tier, SubscriptionStatus Status, AccountType Account) MapStripeStatus(
        string stripeStatus)
    {
        return stripeStatus switch
        {
            "active" or "trialing" => (SubscriptionTier.Premium, SubscriptionStatus.Active, AccountType.Premium),
            "past_due" => (SubscriptionTier.Premium, SubscriptionStatus.PastDue, AccountType.Premium),
            "canceled" or "unpaid" or "incomplete_expired" =>
                (SubscriptionTier.Basic, SubscriptionStatus.Cancelled, AccountType.Basic),
            "incomplete" => (SubscriptionTier.Basic, SubscriptionStatus.Active, AccountType.Basic),
            _ => (SubscriptionTier.Basic, SubscriptionStatus.Active, AccountType.Basic)
        };
    }
}
