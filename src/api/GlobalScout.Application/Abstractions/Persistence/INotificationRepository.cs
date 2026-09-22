using GlobalScout.Application.Social;
using GlobalScout.Domain.Social;

namespace GlobalScout.Application.Abstractions.Persistence;

public interface INotificationRepository
{
    /// <summary>
    /// Persists a notification for <paramref name="recipientUserId"/>. If an unread notification
    /// already exists for the same (recipient, type, actor) triple, it is bumped (CreatedAt and
    /// RelatedEntityId updated) instead of inserting a duplicate row.
    /// </summary>
    Task<NotificationDto> CreateAsync(
        NotificationType type,
        Guid recipientUserId,
        Guid actorUserId,
        Guid? relatedEntityId,
        CancellationToken cancellationToken);

    Task<(IReadOnlyList<NotificationDto> Items, int Total, int UnreadCount)> GetPageAsync(
        Guid recipientUserId,
        int page,
        int limit,
        CancellationToken cancellationToken);

    Task<(bool Found, int UnreadCount)> MarkReadAsync(
        Guid notificationId,
        Guid recipientUserId,
        CancellationToken cancellationToken);

    Task<(int MarkedCount, int UnreadCount)> MarkAllReadAsync(
        Guid recipientUserId,
        CancellationToken cancellationToken);
}
