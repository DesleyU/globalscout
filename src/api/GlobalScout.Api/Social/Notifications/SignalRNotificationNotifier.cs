using GlobalScout.Application.Abstractions.Social.Notifications;
using GlobalScout.Application.Social;
using Microsoft.AspNetCore.SignalR;

namespace GlobalScout.Api.Social.Notifications;

internal sealed class SignalRNotificationNotifier(IHubContext<NotificationHub> hub) : INotificationRealtimeNotifier
{
    public Task NotifyNewNotificationAsync(
        Guid recipientUserId,
        NotificationDto notification,
        CancellationToken cancellationToken) =>
        hub.Clients.User(recipientUserId.ToString()).SendAsync("ReceiveNotification", notification, cancellationToken);

    public Task NotifyReadStateChangedAsync(
        Guid recipientUserId,
        int unreadCount,
        CancellationToken cancellationToken) =>
        hub.Clients.User(recipientUserId.ToString()).SendAsync("NotificationsUpdated", new { unreadCount }, cancellationToken);
}
