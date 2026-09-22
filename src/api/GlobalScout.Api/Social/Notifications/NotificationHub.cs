using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace GlobalScout.Api.Social.Notifications;

/// <summary>Real-time channel for pushed notifications; events are sent via <see cref="SignalRNotificationNotifier"/>.</summary>
[Authorize]
public sealed class NotificationHub : Hub
{
}
