using GlobalScout.Application.Abstractions.Messaging;

namespace GlobalScout.Application.PlayerIdentity.CreateSelfReportedClaim;

public sealed class CreateSelfReportedPlayerIdentityClaimCommand : ICommand<PlayerIdentityClaimDto>
{
    public Guid UserId { get; init; }

    public string FirstName { get; init; } = string.Empty;

    public string LastName { get; init; } = string.Empty;

    public DateOnly DateOfBirth { get; init; }

    public string Nationality { get; init; } = string.Empty;

    public string CurrentCountry { get; init; } = string.Empty;

    public string CurrentClub { get; init; } = string.Empty;

    public string Position { get; init; } = string.Empty;

    public string? PreviousClub { get; init; }

    public string? League { get; init; }
}
