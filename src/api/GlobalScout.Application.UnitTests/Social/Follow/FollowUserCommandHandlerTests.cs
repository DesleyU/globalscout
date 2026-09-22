using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Abstractions.Social.Notifications;
using GlobalScout.Application.Social;
using GlobalScout.Application.Social.Follow;
using GlobalScout.Domain.Identity;
using GlobalScout.Domain.Social;
using Moq;
using Xunit;

namespace GlobalScout.Application.UnitTests.Social.Follow;

public sealed class FollowUserCommandHandlerTests
{
    [Fact]
    public async Task Handle_allows_a_player_to_follow_a_player()
    {
        var followerId = Guid.NewGuid();
        var targetId = Guid.NewGuid();
        var followId = Guid.NewGuid();
        var expected = new FollowUserResponseDto(
            followId,
            new FollowingUserDto(targetId, "PLAYER", null),
            DateTimeOffset.UtcNow);

        var social = new Mock<ISocialGraphRepository>();
        social.Setup(s => s.UserExistsAsync(targetId, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        social.Setup(s => s.GetUserRoleAsync(followerId, It.IsAny<CancellationToken>())).ReturnsAsync(UserRole.Player);
        social.Setup(s => s.GetUserRoleAsync(targetId, It.IsAny<CancellationToken>())).ReturnsAsync(UserRole.Player);
        social.Setup(s => s.FollowExistsAsync(followerId, targetId, It.IsAny<CancellationToken>())).ReturnsAsync(false);
        social.Setup(s => s.CreateFollowAsync(followerId, targetId, It.IsAny<CancellationToken>())).ReturnsAsync(expected);

        var notificationDto = new NotificationDto(
            Guid.NewGuid(),
            nameof(NotificationType.NewFollower),
            new NotificationActorDto(followerId, "Player", null),
            followId,
            false,
            DateTimeOffset.UtcNow);
        var notifications = new Mock<INotificationRepository>();
        notifications.Setup(n => n.CreateAsync(NotificationType.NewFollower, targetId, followerId, followId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(notificationDto);
        var notifier = new Mock<INotificationRealtimeNotifier>();

        var handler = new FollowUserCommandHandler(social.Object, notifications.Object, notifier.Object);
        var command = new FollowUserCommand { FollowerId = followerId, FollowingUserId = targetId };

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(expected, result.Value);
        notifications.Verify(
            n => n.CreateAsync(NotificationType.NewFollower, targetId, followerId, followId, It.IsAny<CancellationToken>()),
            Times.Once);
        notifier.Verify(
            n => n.NotifyNewNotificationAsync(targetId, notificationDto, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_allows_an_agent_to_follow_a_player()
    {
        var followerId = Guid.NewGuid();
        var targetId = Guid.NewGuid();
        var followId = Guid.NewGuid();
        var expected = new FollowUserResponseDto(
            followId,
            new FollowingUserDto(targetId, "PLAYER", null),
            DateTimeOffset.UtcNow);

        var social = new Mock<ISocialGraphRepository>();
        social.Setup(s => s.UserExistsAsync(targetId, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        social.Setup(s => s.GetUserRoleAsync(followerId, It.IsAny<CancellationToken>())).ReturnsAsync(UserRole.ScoutAgent);
        social.Setup(s => s.GetUserRoleAsync(targetId, It.IsAny<CancellationToken>())).ReturnsAsync(UserRole.Player);
        social.Setup(s => s.FollowExistsAsync(followerId, targetId, It.IsAny<CancellationToken>())).ReturnsAsync(false);
        social.Setup(s => s.CreateFollowAsync(followerId, targetId, It.IsAny<CancellationToken>())).ReturnsAsync(expected);

        var notificationDto = new NotificationDto(
            Guid.NewGuid(),
            nameof(NotificationType.NewFollower),
            new NotificationActorDto(followerId, "ScoutAgent", null),
            followId,
            false,
            DateTimeOffset.UtcNow);
        var notifications = new Mock<INotificationRepository>();
        notifications.Setup(n => n.CreateAsync(NotificationType.NewFollower, targetId, followerId, followId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(notificationDto);
        var notifier = new Mock<INotificationRealtimeNotifier>();

        var handler = new FollowUserCommandHandler(social.Object, notifications.Object, notifier.Object);
        var command = new FollowUserCommand { FollowerId = followerId, FollowingUserId = targetId };

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(expected, result.Value);
        notifier.Verify(
            n => n.NotifyNewNotificationAsync(targetId, notificationDto, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_rejects_a_player_following_an_agent_without_creating_a_follow()
    {
        var followerId = Guid.NewGuid();
        var targetId = Guid.NewGuid();

        var social = new Mock<ISocialGraphRepository>();
        social.Setup(s => s.UserExistsAsync(targetId, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        social.Setup(s => s.GetUserRoleAsync(followerId, It.IsAny<CancellationToken>())).ReturnsAsync(UserRole.Player);
        social.Setup(s => s.GetUserRoleAsync(targetId, It.IsAny<CancellationToken>())).ReturnsAsync(UserRole.ScoutAgent);

        var notifications = new Mock<INotificationRepository>();
        var notifier = new Mock<INotificationRealtimeNotifier>();

        var handler = new FollowUserCommandHandler(social.Object, notifications.Object, notifier.Object);
        var command = new FollowUserCommand { FollowerId = followerId, FollowingUserId = targetId };

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal(SocialErrors.FollowRestrictedToPlayers, result.Error);
        social.Verify(s => s.FollowExistsAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Never);
        social.Verify(
            s => s.CreateFollowAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
        notifications.Verify(
            n => n.CreateAsync(It.IsAny<NotificationType>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid?>(), It.IsAny<CancellationToken>()),
            Times.Never);
        notifier.Verify(
            n => n.NotifyNewNotificationAsync(It.IsAny<Guid>(), It.IsAny<NotificationDto>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
