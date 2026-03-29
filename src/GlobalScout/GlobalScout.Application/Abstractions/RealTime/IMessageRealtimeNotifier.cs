using GlobalScout.Application.Social.Messages;

namespace GlobalScout.Application.Abstractions.RealTime;

public interface IMessageRealtimeNotifier
{
    Task NotifyNewMessageAsync(Guid recipientUserId, MessageDetailDto message, CancellationToken cancellationToken);
}
