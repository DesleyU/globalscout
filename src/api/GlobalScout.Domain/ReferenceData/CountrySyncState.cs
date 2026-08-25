namespace GlobalScout.Domain.ReferenceData;

public sealed class CountrySyncState
{
    public string CountryCode { get; set; } = string.Empty;

    public DateTimeOffset? CompetitionsSyncedAt { get; set; }

    public DateTimeOffset? TeamsSyncedAt { get; set; }

    public int CompetitionCount { get; set; }

    public int TeamCount { get; set; }

    public Guid? LastSyncedByUserId { get; set; }
}
