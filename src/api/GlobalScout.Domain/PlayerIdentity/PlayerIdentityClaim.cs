using GlobalScout.Domain.Identity;

namespace GlobalScout.Domain.PlayerIdentity;

public sealed class PlayerIdentityClaim
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public int ExternalPlayerId { get; set; }

    public string ExternalProvider { get; set; } = string.Empty;

    public string CandidateName { get; set; } = string.Empty;

    public string CandidateClub { get; set; } = string.Empty;

    public string CandidatePosition { get; set; } = string.Empty;

    public string CandidateNationality { get; set; } = string.Empty;

    public int? CandidateAge { get; set; }

    public string? CandidatePhotoUrl { get; set; }

    public string FullName { get; set; } = string.Empty;

    public DateOnly DateOfBirth { get; set; }

    public string Nationality { get; set; } = string.Empty;

    public string CurrentClub { get; set; } = string.Empty;

    public string? PreviousClub { get; set; }

    public Position Position { get; set; }

    public string? League { get; set; }

    public int ConfidenceScore { get; set; }

    public ClaimStatus Status { get; set; } = ClaimStatus.Claimed;

    public string? AdminNote { get; set; }

    public Guid? ReviewedByUserId { get; set; }

    public DateTimeOffset? ReviewedAt { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }

    public ICollection<VerificationEvidence> Evidence { get; set; } = [];
}
