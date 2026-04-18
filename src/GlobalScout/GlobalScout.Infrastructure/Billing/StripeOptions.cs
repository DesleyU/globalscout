namespace GlobalScout.Infrastructure.Billing;

public sealed class StripeOptions
{
    public const string SectionName = "Stripe";

    /// <summary>Stripe secret API key (<c>sk_test_...</c> or <c>sk_live_...</c>).</summary>
    public string SecretKey { get; set; } = "";

    /// <summary>Webhook signing secret from the Stripe Dashboard or <c>stripe listen</c> output.</summary>
    public string WebhookSecret { get; set; } = "";

    /// <summary>Publishable key for the SPA if you use Stripe.js (<c>pk_test_...</c>).</summary>
    public string PublishableKey { get; set; } = "";

    /// <summary>Recurring price id for Premium (e.g. <c>price_...</c>).</summary>
    public string PremiumPriceId { get; set; } = "";

    /// <summary>Public URL of the SPA (no trailing slash), e.g. <c>http://localhost:5173</c>.</summary>
    public string PublicAppBaseUrl { get; set; } = "http://localhost:5173";

    public string CheckoutSuccessPath { get; set; } = "/payment/success";

    public string CheckoutCancelPath { get; set; } = "/payment/cancel";

    public string BillingPortalReturnPath { get; set; } = "/profile";
}
