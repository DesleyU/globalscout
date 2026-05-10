namespace GlobalScout.Api.Endpoints.Users;

/// <summary>Route templates for user APIs (full paths from app root, same style as clean-architecture <c>MapPost("todos", ...)</c>).</summary>
internal static class UsersRoutes
{
    public const string Base = "api/users";

    public static string Profile => $"{Base}/profile";

    public static string Avatar => $"{Base}/avatar";

    public static string AvatarUploadUrl => $"{Base}/avatar/upload-url";

    public static string CompleteAvatarUpload => $"{Base}/avatar/complete";

    public static string AvatarReadUrl => $"{Base}/{{userId:guid}}/avatar/url";

    public static string Search => $"{Base}/search";

    public static string Recommendations => $"{Base}/recommendations";

    public static string ProfileVisitors => $"{Base}/profile/visitors";

    public static string ById => $"{Base}/{{id:guid}}";
}
