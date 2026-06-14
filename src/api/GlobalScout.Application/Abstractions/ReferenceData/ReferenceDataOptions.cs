namespace GlobalScout.Application.Abstractions.ReferenceData;

public sealed class ReferenceDataOptions
{
    public const string SectionName = "ReferenceData";

    /// <summary>
    /// Country names (API-football <c>name</c> values) with preloaded league and team reference data.
    /// </summary>
    public string[] PreloadedCountries { get; set; } =
    [
        "Romania",
        "England",
        "Spain",
        "Italy",
        "Germany",
        "France",
        "Netherlands",
        "Portugal",
        "Turkey",
        "Belgium"
    ];
}
