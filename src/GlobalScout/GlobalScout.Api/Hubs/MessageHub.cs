using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace GlobalScout.Api.Hubs;

/// <summary>Real-time channel for typing indicators or future events; new messages are pushed via <see cref="RealTime.SignalRMessageNotifier"/>.</summary>
[Authorize]
public sealed class MessageHub : Hub
{
}
