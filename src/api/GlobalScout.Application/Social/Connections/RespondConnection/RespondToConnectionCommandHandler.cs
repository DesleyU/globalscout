using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Abstractions.Social.Notifications;
using GlobalScout.Application.Social;
using GlobalScout.Domain.Social;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Social.Connections.RespondConnection;

internal sealed class RespondToConnectionCommandHandler(
    ISocialGraphRepository social,
    INotificationRepository notifications,
    INotificationRealtimeNotifier notifier)
    : ICommandHandler<RespondToConnectionCommand, RespondToConnectionResponseDto>
{
    public async Task<Result<RespondToConnectionResponseDto>> Handle(
        RespondToConnectionCommand command,
        CancellationToken cancellationToken)
    {
        var status = command.Action.Trim().Equals("accept", StringComparison.OrdinalIgnoreCase)
            ? ConnectionStatus.Accepted
            : ConnectionStatus.Rejected;

        var updated = await social.RespondToPendingConnectionAsync(
            command.ConnectionId,
            command.ReceiverId,
            status,
            cancellationToken);

        if (updated is null)
        {
            return Result.Failure<RespondToConnectionResponseDto>(SocialErrors.ConnectionRequestNotFound);
        }

        if (status == ConnectionStatus.Accepted)
        {
            var notification = await notifications.CreateAsync(
                NotificationType.ConnectionAccepted,
                updated.Sender.Id,
                updated.Receiver.Id,
                updated.Id,
                cancellationToken);
            await notifier.NotifyNewNotificationAsync(updated.Sender.Id, notification, cancellationToken);
        }

        return Result.Success(updated);
    }
}
