using GlobalScout.Domain.Identity;

namespace GlobalScout.Application.Subscriptions;

/// <summary>Legacy-shaped payloads for <c>GET /api/account/info</c> (<c>subscriptionService.getBasicLimits/getPremiumLimits</c>).</summary>
public static class AccountLimitsForApi
{
    private static readonly string[] BasicProfileFields = ["avatar", "position", "age", "clubName"];

    private static readonly string[] BasicStatsFields =
    [
        "season",
        "goals",
        "assists",
        "minutes",
        "matches",
        "yellowCards",
        "redCards",
        "rating"
    ];

    public static object ForTier(AccountType tier) =>
        tier == AccountType.Premium ? PremiumLimits() : BasicLimits();

    private static object BasicLimits() => new
    {
        maxConnections = SubscriptionLimits.BasicMaxConnections,
        maxVideos = SubscriptionLimits.BasicMaxVideos,
        profileFields = BasicProfileFields,
        statsFields = BasicStatsFields,
        visitorDetails = false
    };

    private static object PremiumLimits() => new
    {
        maxConnections = -1,
        maxVideos = -1,
        profileFields = "all",
        statsFields = "all",
        visitorDetails = true
    };
}
