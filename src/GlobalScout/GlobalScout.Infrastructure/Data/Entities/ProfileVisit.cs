using GlobalScout.Domain.Identity;
using GlobalScout.Infrastructure.Identity;

namespace GlobalScout.Infrastructure.Data.Entities;

public sealed class ProfileVisit
{
    public Guid Id { get; set; }

    /// <summary>Profile owner user id (same as legacy profileId).</summary>
    public Guid ProfileOwnerId { get; set; }

    public ApplicationUser ProfileOwner { get; set; } = null!;

    public Guid VisitorId { get; set; }

    public ApplicationUser Visitor { get; set; } = null!;

    public UserRole VisitorRole { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
}
