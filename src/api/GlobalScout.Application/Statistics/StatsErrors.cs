using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Statistics;

public static class StatsErrors
{
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
}
