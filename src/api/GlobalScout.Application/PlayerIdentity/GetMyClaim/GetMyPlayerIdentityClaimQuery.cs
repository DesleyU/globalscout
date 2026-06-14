using GlobalScout.Application.Abstractions.Messaging;

namespace GlobalScout.Application.PlayerIdentity.GetMyClaim;

public sealed class GetMyPlayerIdentityClaimQuery : IQuery<GetMyPlayerIdentityClaimResult>
{
    public Guid UserId { get; init; }
}
