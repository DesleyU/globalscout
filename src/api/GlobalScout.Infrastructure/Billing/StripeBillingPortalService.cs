using GlobalScout.Application.Abstractions.Billing;
using GlobalScout.Application.Billing;
using GlobalScout.SharedKernel;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Stripe;
using Stripe.BillingPortal;

namespace GlobalScout.Infrastructure.Billing;

internal sealed class StripeBillingPortalService(
    IOptions<StripeOptions> optionsAccessor,
    ILogger<StripeBillingPortalService> logger) : IBillingPortalService
{
    private readonly StripeOptions _options = optionsAccessor.Value;

    public Task<Result<CreateBillingPortalSessionResult>> CreateCustomerPortalSessionAsync(
        string stripeCustomerId,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(_options.SecretKey))
        {
            return Task.FromResult(Result.Failure<CreateBillingPortalSessionResult>(BillingErrors.StripeNotConfigured));
        }

        var baseUrl = _options.PublicAppBaseUrl.TrimEnd('/');
        var returnPath = _options.BillingPortalReturnPath.StartsWith('/')
            ? _options.BillingPortalReturnPath
            : "/" + _options.BillingPortalReturnPath;
        var returnUrl = $"{baseUrl}{returnPath}";

        var client = new StripeClient(_options.SecretKey);
        var portalService = new Stripe.BillingPortal.SessionService(client);
        var options = new Stripe.BillingPortal.SessionCreateOptions
        {
            Customer = stripeCustomerId,
            ReturnUrl = returnUrl
        };

        try
        {
            var session = portalService.Create(options);
            return Task.FromResult(
                Result.Success(new CreateBillingPortalSessionResult(session.Url)));
        }
        catch (StripeException ex)
        {
            logger.LogWarning(ex, "Stripe Billing Portal session creation failed");
            return Task.FromResult(Result.Failure<CreateBillingPortalSessionResult>(BillingErrors.PortalSessionFailed));
        }
    }
}
