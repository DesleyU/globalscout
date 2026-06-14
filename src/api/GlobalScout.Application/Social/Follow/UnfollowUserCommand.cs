using GlobalScout.Application.Abstractions.Messaging;

namespace GlobalScout.Application.Social.Follow;

public sealed record UnfollowUserResult(string Message);

public sealed class UnfollowUserCommand : ICommand<UnfollowUserResult>
{
    public Guid FollowerId { get; init; }

    public Guid FollowingUserId { get; init; }
}
