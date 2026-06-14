namespace GlobalScout.Api.Endpoints.Social.Messages;

internal static class MessagesRoutes
{
    public const string Base = "api/messages";

    public static string Conversations => $"{Base}/conversations";

    public static string Conversation => $"{Base}/conversation/{{otherUserId:guid}}";

    public static string Read => $"{Base}/read/{{otherUserId:guid}}";
}

internal static class MessagesEndpointTags
{
    public const string Messages = "Messages";
}
