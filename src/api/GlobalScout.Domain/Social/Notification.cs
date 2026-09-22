namespace GlobalScout.Domain.Social;

public sealed class Notification
{
    public Guid Id { get; set; }

    public Guid RecipientUserId { get; set; }

    public NotificationType Type { get; set; }

    public Guid ActorUserId { get; set; }

    public Guid? RelatedEntityId { get; set; }

    public bool IsRead { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset? ReadAt { get; set; }
}
