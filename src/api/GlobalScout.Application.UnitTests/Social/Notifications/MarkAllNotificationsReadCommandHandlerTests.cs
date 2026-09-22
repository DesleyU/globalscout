using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Abstractions.Social.Notifications;
using GlobalScout.Application.Social;
using GlobalScout.Application.Social.Notifications.MarkAllNotificationsRead;
using Moq;
using Xunit;

namespace GlobalScout.Application.UnitTests.Social.Notifications;

public sealed class MarkAllNotificationsReadCommandHandlerTests
{
    [Fact]
    public async Task Handle_marks_all_read_and_pushes_the_zeroed_unread_count()
    {
        var recipientId = Guid.NewGuid();

        var notifications = new Mock<INotificationRepository>();
        notifications.Setup(n => n.MarkAllReadAsync(recipientId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((3, 0));
        var notifier = new Mock<INotificationRealtimeNotifier>();

        var handler = new MarkAllNotificationsReadCommandHandler(notifications.Object, notifier.Object);
        var result = await handler.Handle(new MarkAllNotificationsReadCommand(recipientId), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(new MarkAllNotificationsReadResult(3, 0), result.Value);
        notifier.Verify(
            n => n.NotifyReadStateChangedAsync(recipientId, 0, It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
