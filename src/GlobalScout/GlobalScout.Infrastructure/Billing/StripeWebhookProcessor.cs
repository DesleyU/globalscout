using GlobalScout.Application.Abstractions.Billing;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Billing;
using GlobalScout.SharedKernel;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Linq;
using Stripe;
using Stripe.Checkout;
using StripeSubscription = Stripe.Subscription;

namespace GlobalScout.Infrastructure.Billing;

internal sealed class StripeWebhookProcessor(
    IOptions<StripeOptions> optionsAccessor,
    IBillingEntitlementSync entitlementSync,
    ILogger<StripeWebhookProcessor> logger) : IBillingWebhookProcessor
{
    private readonly StripeOptions _options = optionsAccessor.Value;

    public async Task<Result> ProcessAsync(
        string jsonBody,
        string stripeSignatureHeader,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(_options.WebhookSecret))
        {
            logger.LogWarning("Stripe webhook received but WebhookSecret is not configured");
            return Result.Failure(BillingErrors.StripeNotConfigured);
        }

        Event stripeEvent;
        try
        {
            stripeEvent = EventUtility.ConstructEvent(
                jsonBody,
                stripeSignatureHeader,
                _options.WebhookSecret,
                tolerance: EventUtility.DefaultTimeTolerance,
                throwOnApiVersionMismatch: false);
        }
        catch (StripeException ex)
        {
            logger.LogWarning(ex, "Stripe webhook signature verification failed");
            return Result.Failure(BillingErrors.WebhookInvalid);
        }

        if (await entitlementSync.IsStripeWebhookEventProcessedAsync(stripeEvent.Id, cancellationToken))
        {
            logger.LogInformation("Skipping duplicate Stripe event {EventId}", stripeEvent.Id);
            return Result.Success();
        }

        try
        {
            switch (stripeEvent.Type)
            {
                case EventTypes.CheckoutSessionCompleted:
                    await HandleCheckoutSessionCompletedAsync(stripeEvent, cancellationToken);
                    break;
                case EventTypes.CustomerSubscriptionUpdated:
                    await HandleSubscriptionUpdatedAsync(stripeEvent, cancellationToken);
                    break;
                case EventTypes.CustomerSubscriptionDeleted:
                    await HandleSubscriptionDeletedAsync(stripeEvent, cancellationToken);
                    break;
                case EventTypes.InvoicePaymentFailed:
                    await HandleInvoicePaymentFailedAsync(stripeEvent, cancellationToken);
                    break;
                default:
                    logger.LogInformation("Unhandled Stripe event type {Type}", stripeEvent.Type);
                    break;
            }

            await entitlementSync.RecordStripeWebhookEventAsync(stripeEvent.Id, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error handling Stripe event {EventId}", stripeEvent.Id);
            throw;
        }

        return Result.Success();
    }

    private async Task HandleCheckoutSessionCompletedAsync(Event stripeEvent, CancellationToken cancellationToken)
    {
        if (stripeEvent.Data.Object is not Session session)
        {
            logger.LogWarning("checkout.session.completed payload was not a Session");
            return;
        }

        if (!string.Equals(session.Mode, "subscription", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        var userIdStr = session.Metadata?.GetValueOrDefault("user_id") ?? session.ClientReferenceId;
        if (!Guid.TryParse(userIdStr, out var userId))
        {
            logger.LogWarning("checkout.session.completed missing user_id metadata");
            return;
        }

        var customerId = session.CustomerId;
        var subscriptionId = session.SubscriptionId;
        if (string.IsNullOrWhiteSpace(customerId) || string.IsNullOrWhiteSpace(subscriptionId))
        {
            logger.LogWarning("checkout.session.completed missing customer or subscription id");
            return;
        }

        await entitlementSync.SyncPremiumFromCheckoutAsync(userId, customerId, subscriptionId, cancellationToken);
    }

    private async Task HandleSubscriptionUpdatedAsync(Event stripeEvent, CancellationToken cancellationToken)
    {
        if (stripeEvent.Data.Object is not StripeSubscription subscription)
        {
            return;
        }

        var periodEnd = ToPeriodEnd(subscription);
        await entitlementSync.SyncFromStripeSubscriptionAsync(
            subscription.Id,
            subscription.CustomerId ?? "",
            subscription.Status,
            periodEnd,
            cancellationToken);
    }

    private async Task HandleSubscriptionDeletedAsync(Event stripeEvent, CancellationToken cancellationToken)
    {
        if (stripeEvent.Data.Object is not StripeSubscription subscription)
        {
            return;
        }

        await entitlementSync.RevokePremiumByStripeSubscriptionIdAsync(subscription.Id, cancellationToken);
    }

    private async Task HandleInvoicePaymentFailedAsync(Event stripeEvent, CancellationToken cancellationToken)
    {
        if (stripeEvent.Data.Object is not Invoice invoice)
        {
            return;
        }

        var subscriptionId = invoice.Parent?.SubscriptionDetails?.SubscriptionId;
        if (string.IsNullOrWhiteSpace(subscriptionId))
        {
            return;
        }

        await entitlementSync.SyncFromStripeSubscriptionAsync(
            subscriptionId,
            invoice.CustomerId ?? "",
            "past_due",
            currentPeriodEnd: null,
            cancellationToken);
    }

    private static DateTimeOffset? ToPeriodEnd(StripeSubscription subscription)
    {
        var item = subscription.Items?.Data?.FirstOrDefault();
        if (item?.CurrentPeriodEnd is not { } end || end == default)
        {
            return null;
        }

        return end.Kind == DateTimeKind.Utc
            ? new DateTimeOffset(end)
            : new DateTimeOffset(DateTime.SpecifyKind(end, DateTimeKind.Utc));
    }
}
