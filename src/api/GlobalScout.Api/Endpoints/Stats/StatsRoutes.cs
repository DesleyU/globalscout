namespace GlobalScout.Api.Endpoints.Stats;

internal static class StatsRoutes
{
    public const string Base = "api/stats";

    public static string Me => $"{Base}/me";

    public static string User => $"{Base}/user/{{userId:guid}}";

    public static string Refresh => $"{Base}/refresh";

    public static string RefreshAll => $"{Base}/refresh/all";

    public static string UpdateStatus => $"{Base}/update-status";
}

internal static class StatsEndpointTags
{
    public const string Stats = "Statistics";
}
