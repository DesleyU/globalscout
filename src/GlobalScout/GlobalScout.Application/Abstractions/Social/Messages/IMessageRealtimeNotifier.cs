using GlobalScout.Application.Social.Messages;

namespace GlobalScout.Application.Abstractions.Social.Messages;

public interface IMessageRealtimeNotifier
{
    Task NotifyNewMessageAsync(Guid recipientUserId, MessageDetailDto message, CancellationToken cancellationToken);
}
