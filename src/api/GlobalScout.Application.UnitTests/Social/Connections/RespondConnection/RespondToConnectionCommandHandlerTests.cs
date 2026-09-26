using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Abstractions.Social.Notifications;
using GlobalScout.Application.Social;
using GlobalScout.Application.Social.Connections.RespondConnection;
using GlobalScout.Domain.Social;
using Moq;
using Xunit;

namespace GlobalScout.Application.UnitTests.Social.Connections.RespondConnection;

public sealed class RespondToConnectionCommandHandlerTests
{
    [Fact]
    public async Task Handle_creates_and_pushes_a_notification_when_the_request_is_accepted()
    {
        var senderId = Guid.NewGuid();
        var receiverId = Guid.NewGuid();
        var connectionId = Guid.NewGuid();

        var updated = new RespondToConnectionResponseDto(
            connectionId,
            "ACCEPTED",
            null,
            null,
            DateTimeOffset.UtcNow,
            DateTimeOffset.UtcNow,
            new ConnectionUserSummaryDto(senderId, "Player", null),
            new ConnectionUserSummaryDto(receiverId, "Player", null));

        var social = new Mock<ISocialGraphRepository>();
        social.Setup(s => s.RespondToPendingConnectionAsync(connectionId, receiverId, ConnectionStatus.Accepted, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(updated);

        var notificationDto = new NotificationDto(
            Guid.NewGuid(),
            nameof(NotificationType.ConnectionAccepted),
            new NotificationActorDto(receiverId, "Player", null),
            connectionId,
            false,
            DateTimeOffset.UtcNow);
        var notifications = new Mock<INotificationRepository>();
        notifications.Setup(n => n.CreateAsync(
                NotificationType.ConnectionAccepted,
                senderId,
                receiverId,
                connectionId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(notificationDto);

        var notifier = new Mock<INotificationRealtimeNotifier>();

        var handler = new RespondToConnectionCommandHandler(social.Object, notifications.Object, notifier.Object);
        var command = new RespondToConnectionCommand
        {
            ReceiverId = receiverId,
            ConnectionId = connectionId,
            Action = "accept",
        };

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsSuccess);
        notifications.Verify(
            n => n.CreateAsync(NotificationType.ConnectionAccepted, senderId, receiverId, connectionId, It.IsAny<CancellationToken>()),
            Times.Once);
        notifier.Verify(
            n => n.NotifyNewNotificationAsync(senderId, notificationDto, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_does_not_create_a_notification_when_the_request_is_rejected()
    {
        var senderId = Guid.NewGuid();
        var receiverId = Guid.NewGuid();
        var connectionId = Guid.NewGuid();

        var updated = new RespondToConnectionResponseDto(
            connectionId,
            "REJECTED",
            null,
            null,
            DateTimeOffset.UtcNow,
            DateTimeOffset.UtcNow,
            new ConnectionUserSummaryDto(senderId, "Player", null),
            new ConnectionUserSummaryDto(receiverId, "Player", null));

        var social = new Mock<ISocialGraphRepository>();
        social.Setup(s => s.RespondToPendingConnectionAsync(connectionId, receiverId, ConnectionStatus.Rejected, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(updated);

        var notifications = new Mock<INotificationRepository>();
        var notifier = new Mock<INotificationRealtimeNotifier>();

        var handler = new RespondToConnectionCommandHandler(social.Object, notifications.Object, notifier.Object);
        var command = new RespondToConnectionCommand
        {
            ReceiverId = receiverId,
            ConnectionId = connectionId,
            Action = "reject",
        };

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsSuccess);
        notifications.Verify(
            n => n.CreateAsync(It.IsAny<NotificationType>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid?>(), It.IsAny<CancellationToken>()),
            Times.Never);
        notifier.Verify(
            n => n.NotifyNewNotificationAsync(It.IsAny<Guid>(), It.IsAny<NotificationDto>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Handle_does_not_create_a_notification_when_the_connection_is_not_found()
    {
        var receiverId = Guid.NewGuid();
        var connectionId = Guid.NewGuid();

        var social = new Mock<ISocialGraphRepository>();
        social.Setup(s => s.RespondToPendingConnectionAsync(connectionId, receiverId, ConnectionStatus.Accepted, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RespondToConnectionResponseDto?)null);

        var notifications = new Mock<INotificationRepository>();
        var notifier = new Mock<INotificationRealtimeNotifier>();

        var handler = new RespondToConnectionCommandHandler(social.Object, notifications.Object, notifier.Object);
        var command = new RespondToConnectionCommand
        {
            ReceiverId = receiverId,
            ConnectionId = connectionId,
            Action = "accept",
        };

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal(SocialErrors.ConnectionRequestNotFound, result.Error);
        notifications.Verify(
            n => n.CreateAsync(It.IsAny<NotificationType>(), It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid?>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }
}
