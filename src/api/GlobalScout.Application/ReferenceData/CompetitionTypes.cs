using GlobalScout.Domain.ReferenceData;

namespace GlobalScout.Application.ReferenceData;

public static class CompetitionTypes
{
    public const string League = "League";
    public const string Cup = "Cup";

    public static string ToApiString(CompetitionType type) =>
        type switch
        {
            CompetitionType.League => League,
            CompetitionType.Cup => Cup,
            _ => throw new ArgumentOutOfRangeException(nameof(type), type, null)
        };

    public static string? ToApiString(CompetitionType? type) =>
        type is null ? null : ToApiString(type.Value);

    public static CompetitionType? Parse(string? value) =>
        value switch
        {
            League => CompetitionType.League,
            Cup => CompetitionType.Cup,
            _ => null
        };

    public static string? ResolveDisplayType(string? type, CompetitionType? submittedTypeHint) =>
        type ?? ToApiString(submittedTypeHint);
}
