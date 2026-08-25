namespace GlobalScout.Api.Endpoints.ReferenceData;

internal static class ReferenceDataRoutes
{
    public const string Base = "api/reference-data/football";

    public static string Countries => $"{Base}/countries";

    public static string TeamsSearch => $"{Base}/teams/search";

    public static string Teams => $"{Base}/teams";

    public static string Competitions => $"{Base}/competitions";

    public static string CompetitionsSearch => $"{Base}/competitions/search";
}
