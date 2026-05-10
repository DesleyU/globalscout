namespace GlobalScout.Api.Endpoints.Media;

internal static class MediaRoutes
{
    public const string Base = "api/media";

    public static string Video => $"{Base}/video";

    public static string VideoUploadUrl => $"{Base}/video/upload-url";

    public static string CompleteVideoUpload => $"{Base}/video/complete";

    public static string VideosSelf => $"{Base}/videos";

    public static string VideosForUser => $"{Base}/videos/{{userId:guid}}";

    public static string MediaReadUrl => $"{Base}/{{mediaId:guid}}/url";

    public static string DeleteVideo => $"{Base}/video/{{videoId:guid}}";
}

internal static class MediaEndpointTags
{
    public const string Media = "Media";
}
