using GlobalScout.Domain.PlayerIdentity;

namespace GlobalScout.Api.Endpoints.PlayerIdentity;

internal sealed record PlayerIdentitySearchRequest(
    string FirstName,
    string LastName,
    DateOnly DateOfBirth,
    string Nationality,
    string CurrentCountry,
    int CurrentTeamId,
    string CurrentTeamName,
    string Position,
    string? PreviousClub,
    string? League);

internal sealed record CreatePlayerIdentityClaimRequest(
    int ExternalPlayerId,
    string? Provider,
    string FirstName,
    string LastName,
    DateOnly DateOfBirth,
    string Nationality,
    string CurrentCountry,
    int CurrentTeamId,
    string CurrentClub,
    string Position,
    string? PreviousClub,
    string? League);

internal sealed record InitiateEvidenceUploadRequest(
    string FileName,
    string ContentType,
    long ContentLength);

internal sealed record CompleteEvidenceUploadRequest(
    string StorageKey,
    string FileName,
    string ContentType,
    EvidenceType Type,
    string? Note);

internal sealed record AddLinkEvidenceRequest(
    EvidenceType Type,
    string Url,
    string? Note);
