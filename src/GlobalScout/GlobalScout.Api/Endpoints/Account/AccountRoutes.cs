namespace GlobalScout.Api.Endpoints.Account;

internal static class AccountRoutes
{
    public const string Base = "api/account";

    public static string Info => $"{Base}/info";

    public static string Upgrade => $"{Base}/upgrade";

    public static string Downgrade => $"{Base}/downgrade";
}

internal static class AccountEndpointTags
{
    public const string Account = "Account";
}
