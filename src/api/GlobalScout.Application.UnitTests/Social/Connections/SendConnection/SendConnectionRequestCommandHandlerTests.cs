using GlobalScout.Application.Abstractions.Auth;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Abstractions.Social.Notifications;
using GlobalScout.Application.Auth;
using GlobalScout.Application.Social;
using GlobalScout.Application.Social.Connections.SendConnection;
using GlobalScout.Domain.Identity;
using GlobalScout.Domain.Social;
using Moq;
using Xunit;

namespace GlobalScout.Application.UnitTests.Social.Connections.SendConnection;

public sealed class SendConnectionRequestCommandHandlerTests
{
    [Fact]
    public async Task Handle_blocks_an_unverified_sender_without_creating_a_connection()
    {
        var senderId = Guid.NewGuid();
        var receiverId = Guid.NewGuid();

        var identityStore = new Mock<IUserIdentityStore>();
        identityStore.Setup(s => s.IsEmailConfirmedAsync(senderId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var social = new Mock<ISocialGraphRepository>();
        var notifications = new Mock<INotificationRepository>();
        var notifier = new Mock<INotificationRealtimeNotifier>();

        var handler = new SendConnectionRequestCommandHandler(
            social.Object,
            identityStore.Object,
            notifications.Object,
            notifier.Object);
        var command = new SendConnectionRequestCommand
        {
            SenderId = senderId,
            ReceiverId = receiverId,
        };

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal(AuthErrors.EmailNotVerified, result.Error);
        social.Verify(
            s => s.CreateConnectionAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
        social.Verify(s => s.IsActiveUserAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Never);
        notifications.Verify(
            n => n.CreateAsync(It.IsAny<NotificationType>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid?>(), It.IsAny<CancellationToken>()),
            Times.Never);
        notifier.Verify(
            n => n.NotifyNewNotificationAsync(It.IsAny<Guid>(), It.IsAny<NotificationDto>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Handle_creates_and_pushes_a_notification_when_the_request_succeeds()
    {
        var senderId = Guid.NewGuid();
        var receiverId = Guid.NewGuid();
        var connectionId = Guid.NewGuid();

        var identityStore = new Mock<IUserIdentityStore>();
        identityStore.Setup(s => s.IsEmailConfirmedAsync(senderId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var social = new Mock<ISocialGraphRepository>();
        social.Setup(s => s.IsActiveUserAsync(receiverId, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        social.Setup(s => s.GetAccountTypeAsync(senderId, It.IsAny<CancellationToken>())).ReturnsAsync(AccountType.Premium);
        social.Setup(s => s.ConnectionExistsAsync(senderId, receiverId, It.IsAny<CancellationToken>())).ReturnsAsync(false);
        social.Setup(s => s.ConnectionExistsAsync(receiverId, senderId, It.IsAny<CancellationToken>())).ReturnsAsync(false);

        var created = new SendConnectionResponseDto(
            connectionId,
            "PENDING",
            null,
            DateTimeOffset.UtcNow,
            new ConnectionUserSummaryDto(senderId, "Player", null),
            new ConnectionUserSummaryDto(receiverId, "Player", null));
        social.Setup(s => s.CreateConnectionAsync(senderId, receiverId, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(created);

        var notificationDto = new NotificationDto(
            Guid.NewGuid(),
            nameof(NotificationType.ConnectionRequestReceived),
            new NotificationActorDto(senderId, "Player", null),
            connectionId,
            false,
            DateTimeOffset.UtcNow);
        var notifications = new Mock<INotificationRepository>();
        notifications.Setup(n => n.CreateAsync(
                NotificationType.ConnectionRequestReceived,
                receiverId,
                senderId,
                connectionId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(notificationDto);

        var notifier = new Mock<INotificationRealtimeNotifier>();

        var handler = new SendConnectionRequestCommandHandler(
            social.Object,
            identityStore.Object,
            notifications.Object,
            notifier.Object);
        var command = new SendConnectionRequestCommand
        {
            SenderId = senderId,
            ReceiverId = receiverId,
        };

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsSuccess);
        notifications.Verify(
            n => n.CreateAsync(NotificationType.ConnectionRequestReceived, receiverId, senderId, connectionId, It.IsAny<CancellationToken>()),
            Times.Once);
        notifier.Verify(
            n => n.NotifyNewNotificationAsync(receiverId, notificationDto, It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
