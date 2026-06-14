namespace GlobalScout.Api.Endpoints.Social.Follow;

internal static class FollowRoutes
{
    public const string Base = "api/follow";

    public static string FollowUser => $"{Base}/{{userId:guid}}/follow";

    public static string UnfollowUser => $"{Base}/{{userId:guid}}/unfollow";

    public static string Followers => $"{Base}/{{userId:guid}}/followers";

    public static string Following => $"{Base}/{{userId:guid}}/following";

    public static string Status => $"{Base}/{{userId:guid}}/status";

    public static string Stats => $"{Base}/{{userId:guid}}/stats";
}

internal static class FollowEndpointTags
{
    public const string Follow = "Follow";
}
