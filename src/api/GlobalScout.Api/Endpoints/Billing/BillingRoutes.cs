namespace GlobalScout.Api.Endpoints.Billing;

internal static class BillingRoutes
{
    public const string Base = "api/billing";

    public static string CheckoutSession => $"{Base}/checkout-session";

    public static string PortalSession => $"{Base}/portal-session";

    public static string Webhook => $"{Base}/webhook";
}

internal static class BillingEndpointTags
{
    public const string Billing = "Billing";
}
