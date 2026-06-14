namespace GlobalScout.Domain.Social;

public sealed class Follow
{
    public Guid Id { get; set; }

    public Guid FollowerId { get; set; }

    public Guid FollowingId { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
}
