using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Social;

namespace GlobalScout.Application.Social.Notifications.MarkAllNotificationsRead;

public sealed record MarkAllNotificationsReadCommand(Guid RecipientUserId) : ICommand<MarkAllNotificationsReadResult>;
