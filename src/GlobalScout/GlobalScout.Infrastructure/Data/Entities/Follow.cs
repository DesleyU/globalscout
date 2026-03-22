using GlobalScout.Infrastructure.Identity;

namespace GlobalScout.Infrastructure.Data.Entities;

public sealed class Follow
{
    public Guid Id { get; set; }

    public Guid FollowerId { get; set; }

    public ApplicationUser Follower { get; set; } = null!;

    public Guid FollowingId { get; set; }

    public ApplicationUser Following { get; set; } = null!;

    public DateTimeOffset CreatedAt { get; set; }
}
