using GlobalScout.Domain.Identity;

namespace GlobalScout.Domain.Users;

public sealed class ProfileVisit
{
    public Guid Id { get; set; }

    /// <summary>Profile owner user id (same as legacy profileId).</summary>
    public Guid ProfileOwnerId { get; set; }

    public Guid VisitorId { get; set; }

    public UserRole VisitorRole { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
}
