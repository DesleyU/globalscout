using GlobalScout.Application.Abstractions.Messaging;

namespace GlobalScout.Application.PlayerIdentity.Admin.ApproveClaim;

public sealed class ApprovePlayerIdentityClaimCommand : ICommand<PlayerIdentityClaimDto>
{
    public Guid AdminUserId { get; init; }

    public Guid ClaimId { get; init; }

    public string? Note { get; init; }
}
