using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Media;

internal static class MediaErrors
{
    public static readonly Error OnlyPlayersCanUpload = Error.Forbidden(
        "Media.OnlyPlayers",
        "Only players can upload videos.");

    public static Error VideoLimitReached(int current, int max) =>
        Error.Forbidden(
            "Media.VideoLimitReached",
            $"Video upload limit reached. Basic users can upload up to {max} video(s). Upgrade to Premium for unlimited uploads.",
            new Dictionary<string, object?>
            {
                ["limit"] = max,
                ["current"] = current
            });

    public static readonly Error VideoNotFound = Error.NotFound(
        "Media.VideoNotFound",
        "Video not found.");
}
