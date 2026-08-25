namespace GlobalScout.Domain.ReferenceData;

public sealed class Team
{
    public Guid Id { get; set; }

    public string CountryCode { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string NameNormalized { get; set; } = string.Empty;

    public int? ExternalTeamId { get; set; }

    public string? Code { get; set; }

    public int? Founded { get; set; }

    public bool IsNational { get; set; }

    public string? LogoUrl { get; set; }

    public ReferenceDataSource Source { get; set; }

    public ReferenceDataStatus Status { get; set; }

    public Guid? MergedIntoTeamId { get; set; }

    public Guid? SubmittedByUserId { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }
}
