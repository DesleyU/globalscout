using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Social;

namespace GlobalScout.Application.Social.Notifications.GetNotifications;

public sealed record GetNotificationsQuery(Guid RecipientUserId, int Page, int Limit) : IQuery<GetNotificationsResult>;
