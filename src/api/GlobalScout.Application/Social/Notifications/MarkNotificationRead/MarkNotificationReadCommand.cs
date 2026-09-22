using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Social;

namespace GlobalScout.Application.Social.Notifications.MarkNotificationRead;

public sealed record MarkNotificationReadCommand(Guid RecipientUserId, Guid NotificationId) : ICommand<MarkNotificationReadResult>;
