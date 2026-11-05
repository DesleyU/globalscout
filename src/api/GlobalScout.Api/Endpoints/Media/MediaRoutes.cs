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

    public static string Photo => $"{Base}/photo";

    public static string PhotoUploadUrl => $"{Base}/photo/upload-url";

    public static string CompletePhotoUpload => $"{Base}/photo/complete";

    public static string PhotosSelf => $"{Base}/photos";

    public static string PhotosForUser => $"{Base}/photos/{{userId:guid}}";

    public static string DeletePhoto => $"{Base}/photo/{{photoId:guid}}";
}

internal static class MediaEndpointTags
{
    public const string Media = "Media";
}
