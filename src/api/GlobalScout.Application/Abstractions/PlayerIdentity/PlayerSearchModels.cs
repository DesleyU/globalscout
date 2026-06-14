using GlobalScout.Domain.Identity;

namespace GlobalScout.Application.Abstractions.PlayerIdentity;

public sealed record PlayerSearchCriteria(
    string FirstName,
    string LastName,
    DateOnly DateOfBirth,
    string Nationality,
    string CurrentCountry,
    int CurrentTeamId,
    string CurrentClub,
    Position Position,
    string? PreviousClub = null,
    string? League = null)
{
    public string DisplayName =>
        string.Join(' ', new[] { FirstName.Trim(), LastName.Trim() }
            .Where(part => !string.IsNullOrWhiteSpace(part)));
}

public sealed record ExternalPlayerCandidate(
    int ExternalPlayerId,
    string Provider,
    string FirstName,
    string LastName,
    string Name,
    string Club,
    string Position,
    string Nationality,
    int? Age,
    DateOnly? DateOfBirth,
    string? PhotoUrl,
    string? PreviousClub = null,
    string? League = null);
