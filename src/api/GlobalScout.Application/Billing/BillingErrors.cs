using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Billing;

public static class BillingErrors
{
    public static readonly Error StripeNotConfigured =
        Error.Problem("Billing.StripeNotConfigured", "Stripe billing is not configured.");

    public static readonly Error AlreadyPremium =
        Error.Problem("Billing.AlreadyPremium", "Account already has premium access.");

    public static readonly Error NoStripeCustomer =
        Error.Problem("Billing.NoStripeCustomer", "No Stripe customer on file. Subscribe first.");

    public static readonly Error CheckoutSessionFailed =
        Error.Problem("Billing.CheckoutSessionFailed", "Could not start checkout.");

    public static readonly Error PortalSessionFailed =
        Error.Problem("Billing.PortalSessionFailed", "Could not open billing portal.");

    public static readonly Error WebhookInvalid =
        Error.Problem("Billing.WebhookInvalid", "Invalid Stripe webhook payload or signature.");
}
