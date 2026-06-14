using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Social;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Social.Follow;

internal sealed class FollowUserCommandHandler(ISocialGraphRepository social)
    : ICommandHandler<FollowUserCommand, FollowUserResponseDto>
{
    public async Task<Result<FollowUserResponseDto>> Handle(FollowUserCommand command, CancellationToken cancellationToken)
    {
        if (command.FollowerId == command.FollowingUserId)
        {
            return Result.Failure<FollowUserResponseDto>(SocialErrors.CannotFollowSelf);
        }

        if (!await social.UserExistsAsync(command.FollowingUserId, cancellationToken))
        {
            return Result.Failure<FollowUserResponseDto>(SocialErrors.UserNotFound);
        }

        if (await social.FollowExistsAsync(command.FollowerId, command.FollowingUserId, cancellationToken))
        {
            return Result.Failure<FollowUserResponseDto>(SocialErrors.AlreadyFollowing);
        }

        var created = await social.CreateFollowAsync(command.FollowerId, command.FollowingUserId, cancellationToken);
        if (created is null)
        {
            return Result.Failure<FollowUserResponseDto>(SocialErrors.AlreadyFollowing);
        }

        return Result.Success(created);
    }
}
