using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Abstractions.Social.Notifications;
using GlobalScout.Application.Social;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Social.Notifications.MarkAllNotificationsRead;

internal sealed class MarkAllNotificationsReadCommandHandler(
    INotificationRepository notifications,
    INotificationRealtimeNotifier notifier)
    : ICommandHandler<MarkAllNotificationsReadCommand, MarkAllNotificationsReadResult>
{
    public async Task<Result<MarkAllNotificationsReadResult>> Handle(
        MarkAllNotificationsReadCommand command,
        CancellationToken cancellationToken)
    {
        var (markedCount, unreadCount) = await notifications.MarkAllReadAsync(command.RecipientUserId, cancellationToken);

        await notifier.NotifyReadStateChangedAsync(command.RecipientUserId, unreadCount, cancellationToken);

        return Result.Success(new MarkAllNotificationsReadResult(markedCount, unreadCount));
    }
}
