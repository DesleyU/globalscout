using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Abstractions.Social.Notifications;
using GlobalScout.Application.Social;
using GlobalScout.Application.Social.Notifications.MarkNotificationRead;
using Moq;
using Xunit;

namespace GlobalScout.Application.UnitTests.Social.Notifications;

public sealed class MarkNotificationReadCommandHandlerTests
{
    [Fact]
    public async Task Handle_returns_not_found_when_the_repository_reports_no_match()
    {
        var recipientId = Guid.NewGuid();
        var notificationId = Guid.NewGuid();

        var notifications = new Mock<INotificationRepository>();
        notifications.Setup(n => n.MarkReadAsync(notificationId, recipientId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((false, 0));
        var notifier = new Mock<INotificationRealtimeNotifier>();

        var handler = new MarkNotificationReadCommandHandler(notifications.Object, notifier.Object);
        var result = await handler.Handle(new MarkNotificationReadCommand(recipientId, notificationId), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal(SocialErrors.NotificationNotFound, result.Error);
        notifier.Verify(
            n => n.NotifyReadStateChangedAsync(It.IsAny<Guid>(), It.IsAny<int>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Handle_marks_read_and_pushes_the_updated_unread_count_on_success()
    {
        var recipientId = Guid.NewGuid();
        var notificationId = Guid.NewGuid();

        var notifications = new Mock<INotificationRepository>();
        notifications.Setup(n => n.MarkReadAsync(notificationId, recipientId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((true, 2));
        var notifier = new Mock<INotificationRealtimeNotifier>();

        var handler = new MarkNotificationReadCommandHandler(notifications.Object, notifier.Object);
        var result = await handler.Handle(new MarkNotificationReadCommand(recipientId, notificationId), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(new MarkNotificationReadResult(notificationId, true, 2), result.Value);
        notifier.Verify(
            n => n.NotifyReadStateChangedAsync(recipientId, 2, It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
