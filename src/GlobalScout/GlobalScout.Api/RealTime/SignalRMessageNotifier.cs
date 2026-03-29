using GlobalScout.Application.Abstractions.RealTime;
using GlobalScout.Application.Social.Messages;
using GlobalScout.Api.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace GlobalScout.Api.RealTime;

internal sealed class SignalRMessageNotifier(IHubContext<MessageHub> hub) : IMessageRealtimeNotifier
{
    public Task NotifyNewMessageAsync(
        Guid recipientUserId,
        MessageDetailDto message,
        CancellationToken cancellationToken) =>
        hub.Clients.User(recipientUserId.ToString()).SendAsync("ReceiveMessage", message, cancellationToken);
}
