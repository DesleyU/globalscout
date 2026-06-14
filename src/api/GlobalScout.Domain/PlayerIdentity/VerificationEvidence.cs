namespace GlobalScout.Domain.PlayerIdentity;

public sealed class VerificationEvidence
{
    public Guid Id { get; set; }

    public Guid ClaimId { get; set; }

    public EvidenceType Type { get; set; }

    public string? StorageKey { get; set; }

    public string? Url { get; set; }

    public string? Note { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
}
