using GlobalScout.Application.Abstractions.Social.Messages;
using GlobalScout.Application.Social.Messages;
using Microsoft.AspNetCore.SignalR;

namespace GlobalScout.Api.Social.Messages;

internal sealed class SignalRMessageNotifier(IHubContext<MessageHub> hub) : IMessageRealtimeNotifier
{
    public Task NotifyMessageCreatedAsync(
        Guid senderId,
        Guid recipientId,
        MessageDetailDto message,
        CancellationToken cancellationToken) =>
        hub.Clients
            .Users([senderId.ToString(), recipientId.ToString()])
            .SendAsync("MessageCreated", message, cancellationToken);
}
