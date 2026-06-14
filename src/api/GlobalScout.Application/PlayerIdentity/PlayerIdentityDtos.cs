using GlobalScout.Application.PlayerIdentity.Matching;
using GlobalScout.Domain.PlayerIdentity;

namespace GlobalScout.Application.PlayerIdentity;

public sealed record PlayerMatchDto(
    int ExternalPlayerId,
    string Provider,
    string Name,
    string Club,
    string Position,
    string Nationality,
    int? Age,
    string? PhotoUrl,
    int ConfidenceScore,
    IReadOnlyList<string> Reasons,
    bool Recommended);

public sealed record SearchPlayersResult(IReadOnlyList<PlayerMatchDto> Matches);

public sealed record VerificationEvidenceDto(
    Guid Id,
    string Type,
    string? StorageKey,
    string? Url,
    string? Note,
    DateTimeOffset CreatedAt);

public sealed record EvidenceReadUrlResult(string Url, DateTimeOffset ExpiresAt);

public sealed record PlayerIdentityClaimDto(
    Guid Id,
    string Status,
    int ExternalPlayerId,
    string ExternalProvider,
    string FullName,
    DateOnly DateOfBirth,
    string Nationality,
    string CurrentClub,
    string Position,
    string CandidateName,
    string CandidateClub,
    string CandidatePosition,
    string CandidateNationality,
    int? CandidateAge,
    string? CandidatePhotoUrl,
    int ConfidenceScore,
    string? AdminNote,
    DateTimeOffset? ReviewedAt,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    IReadOnlyList<VerificationEvidenceDto> Evidence);

public sealed record GetMyPlayerIdentityClaimResult(
    string Status,
    PlayerIdentityClaimDto? Claim);

public sealed record AdminPendingClaimItem(
    PlayerIdentityClaimDto Claim,
    Guid UserId,
    string Email,
    string? UserFullName);

public sealed record AdminPlayerClaimsPagination(int Page, int Limit, int Total, int Pages);

public sealed record ListAdminPlayerClaimsResult(
    IReadOnlyList<AdminPendingClaimItem> Claims,
    AdminPlayerClaimsPagination Pagination);

internal static class PlayerIdentityMapper
{
    public static PlayerMatchDto ToMatchDto(Abstractions.PlayerIdentity.ExternalPlayerCandidate candidate, ConfidenceMatchResult score) =>
        new(
            candidate.ExternalPlayerId,
            candidate.Provider,
            candidate.Name,
            candidate.Club,
            candidate.Position,
            candidate.Nationality,
            candidate.Age,
            candidate.PhotoUrl,
            score.Score,
            score.Reasons,
            ConfidenceScorer.IsRecommended(score));

    public static PlayerIdentityClaimDto ToClaimDto(PlayerIdentityClaim claim) =>
        new(
            claim.Id,
            claim.Status.ToString(),
            claim.ExternalPlayerId,
            claim.ExternalProvider,
            claim.FullName,
            claim.DateOfBirth,
            claim.Nationality,
            claim.CurrentClub,
            claim.Position.ToString(),
            claim.CandidateName,
            claim.CandidateClub,
            claim.CandidatePosition,
            claim.CandidateNationality,
            claim.CandidateAge,
            claim.CandidatePhotoUrl,
            claim.ConfidenceScore,
            claim.AdminNote,
            claim.ReviewedAt,
            claim.CreatedAt,
            claim.UpdatedAt,
            claim.Evidence
                .OrderBy(e => e.CreatedAt)
                .Select(ToEvidenceDto)
                .ToArray());

    public static VerificationEvidenceDto ToEvidenceDto(VerificationEvidence evidence) =>
        new(
            evidence.Id,
            evidence.Type.ToString(),
            evidence.StorageKey,
            evidence.Url,
            evidence.Note,
            evidence.CreatedAt);
}
