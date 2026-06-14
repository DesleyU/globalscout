namespace GlobalScout.Api.Endpoints.Social.Connections;

internal static class ConnectionsRoutes
{
    public const string Base = "api/connections";

    public static string Send => $"{Base}/send";

    public static string Respond => $"{Base}/{{connectionId:guid}}/respond";

    public static string List => Base;

    public static string Requests => $"{Base}/requests";
}

internal static class ConnectionsEndpointTags
{
    public const string Connections = "Connections";
}
