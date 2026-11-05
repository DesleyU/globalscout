using GlobalScout.Application.Social.Messages;

namespace GlobalScout.Application.Abstractions.Social.Messages;

public interface IMessageRealtimeNotifier
{
    /// <summary>Pushes a <c>MessageCreated</c> event to both participants, only after the send commits.</summary>
    Task NotifyMessageCreatedAsync(
        Guid senderId,
        Guid recipientId,
        MessageDetailDto message,
        CancellationToken cancellationToken);
}
