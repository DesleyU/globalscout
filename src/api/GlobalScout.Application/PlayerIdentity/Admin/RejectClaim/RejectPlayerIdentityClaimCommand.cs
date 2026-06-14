using GlobalScout.Application.Abstractions.Messaging;

namespace GlobalScout.Application.PlayerIdentity.Admin.RejectClaim;

public sealed class RejectPlayerIdentityClaimCommand : ICommand<PlayerIdentityClaimDto>
{
    public Guid AdminUserId { get; init; }

    public Guid ClaimId { get; init; }

    public string Note { get; init; } = string.Empty;
}
