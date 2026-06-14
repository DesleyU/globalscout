using GlobalScout.Domain.Identity;
using GlobalScout.Domain.Social;
using GlobalScout.Domain.Subscriptions;
using GlobalScout.Domain.Users;
using Microsoft.AspNetCore.Identity;

namespace GlobalScout.Infrastructure.Identity;

public sealed class ApplicationUser : IdentityUser<Guid>
{
    public UserStatus Status { get; set; } = UserStatus.Active;

    public AccountType AccountType { get; set; } = AccountType.Basic;

    public int? PlayerId { get; set; }

    public string? StripeCustomerId { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }

    public Profile? Profile { get; set; }

    public ICollection<Connection> SentConnections { get; set; } = [];

    public ICollection<Connection> ReceivedConnections { get; set; } = [];

    public ICollection<Follow> Following { get; set; } = [];

    public ICollection<Follow> Followers { get; set; } = [];

    public ICollection<Message> SentMessages { get; set; } = [];

    public ICollection<Message> ReceivedMessages { get; set; } = [];

    public ICollection<MediaItem> Media { get; set; } = [];

    public ICollection<PlayerStatistics> PlayerStatistics { get; set; } = [];

    public Subscription? Subscription { get; set; }

    public ICollection<UserBlock> BlockedUsers { get; set; } = [];

    public ICollection<UserBlock> BlockedByUsers { get; set; } = [];
}
