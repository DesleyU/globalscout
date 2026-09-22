namespace GlobalScout.Api.Endpoints.Dev;

internal static class DevRoutes
{
    public const string Base = "api/dev";

    public static string SeedUsers => $"{Base}/seed-users";
}

internal static class DevEndpointTags
{
    public const string Dev = "Dev";
}
