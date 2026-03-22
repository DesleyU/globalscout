using GlobalScout.Infrastructure.Identity;

namespace GlobalScout.Infrastructure.Data.Entities;

public sealed class UserBlock
{
    public Guid BlockerId { get; set; }

    public ApplicationUser Blocker { get; set; } = null!;

    public Guid BlockedId { get; set; }

    public ApplicationUser Blocked { get; set; } = null!;
}
