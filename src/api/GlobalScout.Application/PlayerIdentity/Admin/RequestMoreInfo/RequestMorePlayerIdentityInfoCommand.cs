using GlobalScout.Application.Abstractions.Messaging;

namespace GlobalScout.Application.PlayerIdentity.Admin.RequestMoreInfo;

public sealed class RequestMorePlayerIdentityInfoCommand : ICommand<PlayerIdentityClaimDto>
{
    public Guid AdminUserId { get; init; }

    public Guid ClaimId { get; init; }

    public string Note { get; init; } = string.Empty;
}
