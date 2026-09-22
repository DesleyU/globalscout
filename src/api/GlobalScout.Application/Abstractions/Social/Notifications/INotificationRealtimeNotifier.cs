using GlobalScout.Application.Social;

namespace GlobalScout.Application.Abstractions.Social.Notifications;

public interface INotificationRealtimeNotifier
{
    Task NotifyNewNotificationAsync(Guid recipientUserId, NotificationDto notification, CancellationToken cancellationToken);

    Task NotifyReadStateChangedAsync(Guid recipientUserId, int unreadCount, CancellationToken cancellationToken);
}
