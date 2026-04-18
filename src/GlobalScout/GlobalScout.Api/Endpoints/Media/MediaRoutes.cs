namespace GlobalScout.Api.Endpoints.Media;

internal static class MediaRoutes
{
    public const string Base = "api/media";

    public static string Video => $"{Base}/video";

    public static string VideosSelf => $"{Base}/videos";

    public static string VideosForUser => $"{Base}/videos/{{userId:guid}}";

    public static string DeleteVideo => $"{Base}/video/{{videoId:guid}}";
}

internal static class MediaEndpointTags
{
    public const string Media = "Media";
}
