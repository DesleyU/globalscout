namespace GlobalScout.Application.Subscriptions;

/// <summary>Aligned with legacy <c>subscriptionService.getBasicLimits()</c>.</summary>
public static class SubscriptionLimits
{
    public const int BasicMaxConnections = 10;

    /// <summary>Aligned with legacy <c>subscriptionService.getBasicLimits().maxVideos</c>.</summary>
    public const int BasicMaxVideos = 1;

    /// <summary>Fields visible on another user's stats when that user is BASIC (legacy <c>statsFields</c>).</summary>
    public static readonly string[] BasicTierVisibleStatKeys =
    [
        "id",
        "season",
        "source",
        "schemaVersion",
        "goals",
        "assists",
        "minutes",
        "matches",
        "appearances",
        "yellowCards",
        "redCards",
        "rating"
    ];
}
