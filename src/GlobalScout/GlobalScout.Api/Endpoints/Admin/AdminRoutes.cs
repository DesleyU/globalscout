namespace GlobalScout.Api.Endpoints.Admin;

internal static class AdminRoutes
{
    public const string Base = "api/admin";

    public static string Users => $"{Base}/users";

    public static string UserStatus => $"{Base}/users/{{userId:guid}}/status";

    public static string UserById => $"{Base}/users/{{userId:guid}}";

    public static string Stats => $"{Base}/stats";
}
