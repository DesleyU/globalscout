using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Social;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Social.Follow;

internal sealed class UnfollowUserCommandHandler(ISocialGraphRepository social)
    : ICommandHandler<UnfollowUserCommand, UnfollowUserResult>
{
    public async Task<Result<UnfollowUserResult>> Handle(UnfollowUserCommand command, CancellationToken cancellationToken)
    {
        var removed = await social.DeleteFollowAsync(command.FollowerId, command.FollowingUserId, cancellationToken);
        if (!removed)
        {
            return Result.Failure<UnfollowUserResult>(SocialErrors.NotFollowing);
        }

        return Result.Success(new UnfollowUserResult("Successfully unfollowed user"));
    }
}
