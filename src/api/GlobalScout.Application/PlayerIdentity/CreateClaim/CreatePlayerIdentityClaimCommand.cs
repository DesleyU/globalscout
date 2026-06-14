using GlobalScout.Application.Abstractions.Messaging;

namespace GlobalScout.Application.PlayerIdentity.CreateClaim;

public sealed class CreatePlayerIdentityClaimCommand : ICommand<PlayerIdentityClaimDto>
{
    public Guid UserId { get; init; }

    public int ExternalPlayerId { get; init; }

    public string? Provider { get; init; }

    public string FirstName { get; init; } = string.Empty;

    public string LastName { get; init; } = string.Empty;

    public DateOnly DateOfBirth { get; init; }

    public string Nationality { get; init; } = string.Empty;

    public string CurrentCountry { get; init; } = string.Empty;

    public int CurrentTeamId { get; init; }

    public string CurrentClub { get; init; } = string.Empty;

    public string Position { get; init; } = string.Empty;

    public string? PreviousClub { get; init; }

    public string? League { get; init; }
}
