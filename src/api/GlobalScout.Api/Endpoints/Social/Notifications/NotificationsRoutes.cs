namespace GlobalScout.Api.Endpoints.Social.Notifications;

internal static class NotificationsRoutes
{
    public const string Base = "api/notifications";

    public static string List => Base;

    public static string Read => $"{Base}/{{notificationId:guid}}/read";

    public static string ReadAll => $"{Base}/read-all";
}

internal static class NotificationsEndpointTags
{
    public const string Notifications = "Notifications";
}
