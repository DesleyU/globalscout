using GlobalScout.Infrastructure.Data.Entities;
using GlobalScout.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace GlobalScout.Infrastructure.Data;

public sealed class GlobalScoutDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, Guid>
{
    public GlobalScoutDbContext(DbContextOptions<GlobalScoutDbContext> options)
        : base(options)
    {
    }

    public DbSet<Profile> Profiles => Set<Profile>();

    public DbSet<Club> Clubs => Set<Club>();

    public DbSet<Connection> Connections => Set<Connection>();

    public DbSet<Follow> Follows => Set<Follow>();

    public DbSet<Message> Messages => Set<Message>();

    public DbSet<MediaItem> MediaItems => Set<MediaItem>();

    public DbSet<PlayerStatistics> PlayerStatistics => Set<PlayerStatistics>();

    public DbSet<Subscription> Subscriptions => Set<Subscription>();

    public DbSet<ProfileVisit> ProfileVisits => Set<ProfileVisit>();

    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    public DbSet<UserBlock> UserBlocks => Set<UserBlock>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<ApplicationUser>(b =>
        {
            b.ToTable("asp_net_users");
            b.Property(u => u.CreatedAt).IsRequired();
            b.Property(u => u.UpdatedAt).IsRequired();
        });

        builder.Entity<ApplicationRole>(b => b.ToTable("asp_net_roles"));
        builder.Entity<IdentityUserRole<Guid>>(b => b.ToTable("asp_net_user_roles"));
        builder.Entity<IdentityUserClaim<Guid>>(b => b.ToTable("asp_net_user_claims"));
        builder.Entity<IdentityUserLogin<Guid>>(b => b.ToTable("asp_net_user_logins"));
        builder.Entity<IdentityRoleClaim<Guid>>(b => b.ToTable("asp_net_role_claims"));
        builder.Entity<IdentityUserToken<Guid>>(b => b.ToTable("asp_net_user_tokens"));

        builder.Entity<Profile>(b =>
        {
            b.ToTable("profiles");
            b.HasKey(p => p.UserId);
            b.HasOne(p => p.User)
                .WithOne(u => u.Profile)
                .HasForeignKey<Profile>(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            b.Property(p => p.StatsData).HasColumnType("jsonb");
        });

        builder.Entity<Club>(b =>
        {
            b.ToTable("clubs");
            b.HasIndex(c => c.Name).IsUnique();
        });

        builder.Entity<Connection>(b =>
        {
            b.ToTable("connections");
            b.HasIndex(c => new { c.SenderId, c.ReceiverId }).IsUnique();
            b.HasOne(c => c.Sender)
                .WithMany(u => u.SentConnections)
                .HasForeignKey(c => c.SenderId)
                .OnDelete(DeleteBehavior.Restrict);
            b.HasOne(c => c.Receiver)
                .WithMany(u => u.ReceivedConnections)
                .HasForeignKey(c => c.ReceiverId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<Follow>(b =>
        {
            b.ToTable("follows");
            b.HasIndex(f => new { f.FollowerId, f.FollowingId }).IsUnique();
            b.HasOne(f => f.Follower)
                .WithMany(u => u.Following)
                .HasForeignKey(f => f.FollowerId)
                .OnDelete(DeleteBehavior.Restrict);
            b.HasOne(f => f.Following)
                .WithMany(u => u.Followers)
                .HasForeignKey(f => f.FollowingId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<Message>(b =>
        {
            b.ToTable("messages");
            b.HasOne(m => m.Sender)
                .WithMany(u => u.SentMessages)
                .HasForeignKey(m => m.SenderId)
                .OnDelete(DeleteBehavior.Restrict);
            b.HasOne(m => m.Receiver)
                .WithMany(u => u.ReceivedMessages)
                .HasForeignKey(m => m.ReceiverId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<MediaItem>(b =>
        {
            b.ToTable("media");
            b.HasOne(m => m.User)
                .WithMany(u => u.Media)
                .HasForeignKey(m => m.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<PlayerStatistics>(b =>
        {
            b.ToTable("player_statistics");
            b.HasIndex(p => new { p.UserId, p.Season }).IsUnique();
            b.HasOne(p => p.User)
                .WithMany(u => u.PlayerStatistics)
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Subscription>(b =>
        {
            b.ToTable("subscriptions");
            b.HasIndex(s => s.UserId).IsUnique();
            b.HasOne(s => s.User)
                .WithOne(u => u.Subscription)
                .HasForeignKey<Subscription>(s => s.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<ProfileVisit>(b =>
        {
            b.ToTable("profile_visits");
            b.HasIndex(v => new { v.ProfileOwnerId, v.VisitorId }).IsUnique();
            b.HasOne(v => v.ProfileOwner)
                .WithMany()
                .HasForeignKey(v => v.ProfileOwnerId)
                .OnDelete(DeleteBehavior.Cascade);
            b.HasOne(v => v.Visitor)
                .WithMany()
                .HasForeignKey(v => v.VisitorId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<AuditLog>(b =>
        {
            b.ToTable("audit_logs");
            b.Property(a => a.Details).HasColumnType("jsonb");
            b.HasOne(a => a.User)
                .WithMany()
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<UserBlock>(b =>
        {
            b.ToTable("user_blocks");
            b.HasKey(x => new { x.BlockerId, x.BlockedId });
            b.HasOne(x => x.Blocker)
                .WithMany(u => u.BlockedUsers)
                .HasForeignKey(x => x.BlockerId)
                .OnDelete(DeleteBehavior.Restrict);
            b.HasOne(x => x.Blocked)
                .WithMany(u => u.BlockedByUsers)
                .HasForeignKey(x => x.BlockedId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
