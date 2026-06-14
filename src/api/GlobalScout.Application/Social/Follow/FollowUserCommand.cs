using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Social;

namespace GlobalScout.Application.Social.Follow;

public sealed class FollowUserCommand : ICommand<FollowUserResponseDto>
{
    public Guid FollowerId { get; init; }

    public Guid FollowingUserId { get; init; }
}
