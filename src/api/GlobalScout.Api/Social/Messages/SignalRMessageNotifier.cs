using GlobalScout.Application.Abstractions.Social.Messages;
using GlobalScout.Application.Social.Messages;
using Microsoft.AspNetCore.SignalR;

namespace GlobalScout.Api.Social.Messages;

internal sealed class SignalRMessageNotifier(IHubContext<MessageHub> hub) : IMessageRealtimeNotifier
{
    public Task NotifyNewMessageAsync(
        Guid recipientUserId,
        MessageDetailDto message,
        CancellationToken cancellationToken) =>
        hub.Clients.User(recipientUserId.ToString()).SendAsync("ReceiveMessage", message, cancellationToken);
}
