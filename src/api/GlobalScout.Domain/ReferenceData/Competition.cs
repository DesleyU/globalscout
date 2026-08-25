namespace GlobalScout.Domain.ReferenceData;

public sealed class Competition
{
    public Guid Id { get; set; }

    public string CountryCode { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string NameNormalized { get; set; } = string.Empty;

    public int? ExternalCompetitionId { get; set; }

    public string? Type { get; set; }

    public CompetitionLevel Level { get; set; } = CompetitionLevel.Unknown;

    public string? LogoUrl { get; set; }

    public ReferenceDataSource Source { get; set; }

    public ReferenceDataStatus Status { get; set; }

    public Guid? MergedIntoCompetitionId { get; set; }

    public Guid? SubmittedByUserId { get; set; }

    public CompetitionLevel? SubmittedLevelHint { get; set; }

    public CompetitionType? SubmittedTypeHint { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }
}
