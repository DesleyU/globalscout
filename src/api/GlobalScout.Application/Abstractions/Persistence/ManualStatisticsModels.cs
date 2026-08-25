namespace GlobalScout.Application.Abstractions.Persistence;

/// <summary>Input row for manual season upsert (catalog ids only; names resolved server-side).</summary>
public sealed class ManualCompetitionInput
{
    public Guid TeamCatalogId { get; init; }

    public Guid CompetitionCatalogId { get; init; }

    public int Appearances { get; init; }

    public int Minutes { get; init; }

    public int Goals { get; init; }

    public int Assists { get; init; }

    public int YellowCards { get; init; }

    public int RedCards { get; init; }

    public double? Rating { get; init; }
}

/// <summary>Resolved competition row persisted inside manual stats JSON.</summary>
public sealed class ResolvedManualCompetition
{
    public Guid TeamCatalogId { get; init; }

    public string TeamName { get; init; } = string.Empty;

    public bool TeamIsVerified { get; init; }

    public int? TeamExternalId { get; init; }

    public Guid CompetitionCatalogId { get; init; }

    public string CompetitionName { get; init; } = string.Empty;

    public string CompetitionCountry { get; init; } = string.Empty;

    public string Level { get; init; } = string.Empty;

    public bool CompetitionIsVerified { get; init; }

    public int? CompetitionExternalId { get; init; }

    public int SeasonYear { get; init; }

    public int Appearances { get; init; }

    public int Minutes { get; init; }

    public int Goals { get; init; }

    public int Assists { get; init; }

    public int YellowCards { get; init; }

    public int RedCards { get; init; }

    public double? Rating { get; init; }
}
