using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Abstractions.Social.Notifications;
using GlobalScout.Application.Social;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Social.Notifications.MarkNotificationRead;

internal sealed class MarkNotificationReadCommandHandler(
    INotificationRepository notifications,
    INotificationRealtimeNotifier notifier)
    : ICommandHandler<MarkNotificationReadCommand, MarkNotificationReadResult>
{
    public async Task<Result<MarkNotificationReadResult>> Handle(
        MarkNotificationReadCommand command,
        CancellationToken cancellationToken)
    {
        var (found, unreadCount) = await notifications.MarkReadAsync(
            command.NotificationId,
            command.RecipientUserId,
            cancellationToken);

        if (!found)
        {
            return Result.Failure<MarkNotificationReadResult>(SocialErrors.NotificationNotFound);
        }

        await notifier.NotifyReadStateChangedAsync(command.RecipientUserId, unreadCount, cancellationToken);

        return Result.Success(new MarkNotificationReadResult(command.NotificationId, true, unreadCount));
    }
}
