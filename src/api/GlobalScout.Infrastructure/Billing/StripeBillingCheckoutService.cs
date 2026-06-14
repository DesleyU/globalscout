using GlobalScout.Application.Abstractions.Billing;
using GlobalScout.Application.Billing;
using GlobalScout.SharedKernel;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Stripe;
using Stripe.Checkout;

namespace GlobalScout.Infrastructure.Billing;

internal sealed class StripeBillingCheckoutService(
    IOptions<StripeOptions> optionsAccessor,
    ILogger<StripeBillingCheckoutService> logger) : IBillingCheckoutService
{
    private readonly StripeOptions _options = optionsAccessor.Value;

    public Task<Result<CreateCheckoutSessionResult>> CreatePremiumSubscriptionCheckoutAsync(
        Guid userId,
        string email,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(_options.SecretKey)
            || string.IsNullOrWhiteSpace(_options.PremiumPriceId))
        {
            return Task.FromResult(Result.Failure<CreateCheckoutSessionResult>(BillingErrors.StripeNotConfigured));
        }

        var baseUrl = _options.PublicAppBaseUrl.TrimEnd('/');
        var successUrl = $"{baseUrl}{_options.CheckoutSuccessPath}?session_id={{CHECKOUT_SESSION_ID}}";
        var cancelUrl = $"{baseUrl}{_options.CheckoutCancelPath}";

        var client = new StripeClient(_options.SecretKey);
        var service = new SessionService(client);
        var userKey = userId.ToString("D");
        var options = new SessionCreateOptions
        {
            Mode = "subscription",
            SuccessUrl = successUrl,
            CancelUrl = cancelUrl,
            CustomerEmail = email,
            ClientReferenceId = userKey,
            Metadata = new Dictionary<string, string> { ["user_id"] = userKey },
            LineItems =
            [
                new SessionLineItemOptions
                {
                    Price = _options.PremiumPriceId,
                    Quantity = 1
                }
            ],
            SubscriptionData = new SessionSubscriptionDataOptions
            {
                Metadata = new Dictionary<string, string> { ["user_id"] = userKey }
            }
        };

        try
        {
            Session session = service.Create(options);
            return Task.FromResult(
                Result.Success(new CreateCheckoutSessionResult(session.Id, session.Url)));
        }
        catch (StripeException ex)
        {
            logger.LogWarning(ex, "Stripe Checkout Session creation failed");
            return Task.FromResult(Result.Failure<CreateCheckoutSessionResult>(BillingErrors.CheckoutSessionFailed));
        }
    }
}
