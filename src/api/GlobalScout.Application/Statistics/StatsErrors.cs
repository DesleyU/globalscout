using System.Globalization;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Statistics;

public static class StatsErrors
{
    /// <summary>Minimum time between user-triggered API-Football refreshes.</summary>
    public static readonly TimeSpan RefreshCooldown = TimeSpan.FromHours(1);

    public static Error RefreshTooSoon(TimeSpan retryAfter)
    {
        var minutes = Math.Max(1, (int)Math.Ceiling(retryAfter.TotalMinutes));
        return new Error(
            "Stats.RefreshTooSoon",
            $"Statistics were refreshed recently. Try again in {minutes} minute{(minutes == 1 ? string.Empty : "s")}.",
            ErrorType.Conflict,
            new Dictionary<string, object?>
            {
                ["retryAfterSeconds"] = (int)Math.Ceiling(retryAfter.TotalSeconds),
                ["retryAfterMinutes"] = minutes.ToString(CultureInfo.InvariantCulture)
            });
    }

    public static readonly Error UserNotFound =
        Error.NotFound("Stats.UserNotFound", "User not found.");

    public static readonly Error SeasonRequired =
        Error.Validation("Stats.SeasonRequired", "Season is required.");

    public static readonly Error NoPlayerId =
        Error.Problem("Stats.NoPlayerId", "User does not have a linked API player ID.");

    public static readonly Error ExternalStatsUnavailable =
        Error.Problem("Stats.ExternalUnavailable", "Could not load statistics from external provider.");

    public static readonly Error ApiFootballNotConfigured =
        Error.Problem("Stats.ApiFootballNotConfigured", "API Football is not configured (missing API key).");

    public static readonly Error RefreshInProgress =
        Error.Conflict("Stats.RefreshInProgress", "Statistics refresh is already in progress for this user.");

    public static readonly Error BulkRefreshInProgress =
        Error.Conflict("Stats.BulkRefreshInProgress", "A bulk statistics refresh is already in progress.");

    public static readonly Error ManualSeasonNotFound =
        Error.NotFound("Stats.ManualSeasonNotFound", "No self-reported statistics found for that season.");

    public static readonly Error CompetitionsRequired =
        Error.Validation("Stats.CompetitionsRequired", "At least one competition entry is required.");

    public static readonly Error SeasonCoveredByProvider =
        Error.Conflict(
            "Stats.SeasonCoveredByProvider",
            "This season already has verified statistics from the football database and cannot be entered manually.");

    public static Error UnknownCatalogReference(string entityType, Guid id) =>
        Error.Validation(
            "Stats.UnknownCatalogReference",
            $"The selected {entityType} reference ({id}) is not available.");
}
