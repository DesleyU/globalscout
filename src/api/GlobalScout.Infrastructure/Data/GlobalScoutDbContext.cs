using GlobalScout.Domain.PlayerIdentity;
using GlobalScout.Domain.ReferenceData;
using GlobalScout.Domain.Social;
using GlobalScout.Domain.Subscriptions;
using GlobalScout.Domain.Users;
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

    public DbSet<Connection> Connections => Set<Connection>();

    public DbSet<Follow> Follows => Set<Follow>();

    public DbSet<Message> Messages => Set<Message>();

    public DbSet<MediaItem> MediaItems => Set<MediaItem>();

    public DbSet<PlayerStatistics> PlayerStatistics => Set<PlayerStatistics>();

    public DbSet<Subscription> Subscriptions => Set<Subscription>();

    public DbSet<ProfileVisit> ProfileVisits => Set<ProfileVisit>();

    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    public DbSet<UserBlock> UserBlocks => Set<UserBlock>();

    public DbSet<StripeProcessedWebhookEvent> StripeProcessedWebhookEvents => Set<StripeProcessedWebhookEvent>();

    public DbSet<PlayerIdentityClaim> PlayerIdentityClaims => Set<PlayerIdentityClaim>();

    public DbSet<VerificationEvidence> VerificationEvidence => Set<VerificationEvidence>();

    public DbSet<Competition> Competitions => Set<Competition>();

    public DbSet<Team> Teams => Set<Team>();

    public DbSet<CountrySyncState> CountrySyncStates => Set<CountrySyncState>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.HasPostgresExtension("pg_trgm");

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
            b.Property(p => p.AvatarStorageKey).HasColumnName("avatar_storage_key");
            b.HasOne<ApplicationUser>()
                .WithOne(u => u.Profile)
                .HasForeignKey<Profile>(p => p.UserId)
                .HasConstraintName("fk_profiles_users_user_id")
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Connection>(b =>
        {
            b.ToTable("connections");
            b.HasIndex(c => new { c.SenderId, c.ReceiverId }).IsUnique();
            b.HasOne<ApplicationUser>()
                .WithMany(u => u.SentConnections)
                .HasForeignKey(c => c.SenderId)
                .OnDelete(DeleteBehavior.Restrict);
            b.HasOne<ApplicationUser>()
                .WithMany(u => u.ReceivedConnections)
                .HasForeignKey(c => c.ReceiverId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<Follow>(b =>
        {
            b.ToTable("follows");
            b.HasIndex(f => new { f.FollowerId, f.FollowingId }).IsUnique();
            b.HasOne<ApplicationUser>()
                .WithMany(u => u.Following)
                .HasForeignKey(f => f.FollowerId)
                .OnDelete(DeleteBehavior.Restrict);
            b.HasOne<ApplicationUser>()
                .WithMany(u => u.Followers)
                .HasForeignKey(f => f.FollowingId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<Message>(b =>
        {
            b.ToTable("messages");
            b.HasOne<ApplicationUser>()
                .WithMany(u => u.SentMessages)
                .HasForeignKey(m => m.SenderId)
                .OnDelete(DeleteBehavior.Restrict);
            b.HasOne<ApplicationUser>()
                .WithMany(u => u.ReceivedMessages)
                .HasForeignKey(m => m.ReceiverId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<MediaItem>(b =>
        {
            b.ToTable("media");
            b.Property(m => m.StorageKey).HasColumnName("storage_key");
            b.HasOne<ApplicationUser>()
                .WithMany(u => u.Media)
                .HasForeignKey(m => m.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<PlayerStatistics>(b =>
        {
            b.ToTable("player_statistics");
            b.HasIndex(p => new { p.UserId, p.Season, p.Source }).IsUnique();
            b.Property(p => p.Source).HasMaxLength(64).IsRequired();
            b.Property(p => p.SchemaVersion).HasMaxLength(32).IsRequired();
            b.Property(p => p.Data).HasColumnType("jsonb");
            b.HasOne<ApplicationUser>()
                .WithMany(u => u.PlayerStatistics)
                .HasForeignKey(p => p.UserId)
                .HasConstraintName("fk_player_statistics_users_user_id")
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Subscription>(b =>
        {
            b.ToTable("subscriptions");
            b.HasIndex(s => s.UserId).IsUnique();
            b.HasOne<ApplicationUser>()
                .WithOne(u => u.Subscription)
                .HasForeignKey<Subscription>(s => s.UserId)
                .HasConstraintName("fk_subscriptions_users_user_id")
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<ProfileVisit>(b =>
        {
            b.ToTable("profile_visits");
            b.HasIndex(v => new { v.ProfileOwnerId, v.VisitorId }).IsUnique();
            b.HasOne<ApplicationUser>()
                .WithMany()
                .HasForeignKey(v => v.ProfileOwnerId)
                .HasConstraintName("fk_profile_visits_users_profile_owner_id")
                .OnDelete(DeleteBehavior.Cascade);
            b.HasOne<ApplicationUser>()
                .WithMany()
                .HasForeignKey(v => v.VisitorId)
                .HasConstraintName("fk_profile_visits_users_visitor_id")
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<AuditLog>(b =>
        {
            b.ToTable("audit_logs");
            b.Property(a => a.Details).HasColumnType("jsonb");
            b.HasOne(a => a.User)
                .WithMany()
                .HasForeignKey(a => a.UserId)
                .HasConstraintName("fk_audit_logs_users_user_id")
                .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<StripeProcessedWebhookEvent>(b =>
        {
            b.ToTable("stripe_processed_webhook_events");
            b.HasKey(e => e.EventId);
            b.Property(e => e.EventId).HasMaxLength(128);
        });

        builder.Entity<UserBlock>(b =>
        {
            b.ToTable("user_blocks");
            b.HasKey(x => new { x.BlockerId, x.BlockedId });
            b.HasOne<ApplicationUser>()
                .WithMany(u => u.BlockedUsers)
                .HasForeignKey(x => x.BlockerId)
                .OnDelete(DeleteBehavior.Restrict);
            b.HasOne<ApplicationUser>()
                .WithMany(u => u.BlockedByUsers)
                .HasForeignKey(x => x.BlockedId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<PlayerIdentityClaim>(b =>
        {
            b.ToTable("player_identity_claims");
            b.Property(c => c.ExternalProvider).HasMaxLength(64).IsRequired();
            b.Property(c => c.CandidateFirstName).HasMaxLength(100).IsRequired();
            b.Property(c => c.CandidateLastName).HasMaxLength(100).IsRequired();
            b.Property(c => c.CandidateClub).HasMaxLength(200).IsRequired();
            b.Property(c => c.CandidatePosition).HasMaxLength(100).IsRequired();
            b.Property(c => c.CandidateNationality).HasMaxLength(80).IsRequired();
            b.Property(c => c.CandidatePhotoUrl).HasMaxLength(500);
            b.Property(c => c.FullName).HasMaxLength(200).IsRequired();
            b.Property(c => c.Nationality).HasMaxLength(80).IsRequired();
            b.Property(c => c.CurrentClub).HasMaxLength(200).IsRequired();
            b.Property(c => c.PreviousClub).HasMaxLength(200);
            b.Property(c => c.League).HasMaxLength(200);
            b.Property(c => c.AdminNote).HasMaxLength(1000);
            b.HasIndex(c => c.Status);
            b.HasIndex(c => c.UserId)
                .IsUnique()
                .HasFilter("status IN (2, 3, 4, 6)");
            b.HasOne<ApplicationUser>()
                .WithMany()
                .HasForeignKey(c => c.UserId)
                .HasConstraintName("fk_player_identity_claims_users_user_id")
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<VerificationEvidence>(b =>
        {
            b.ToTable("verification_evidence");
            b.Property(e => e.StorageKey).HasColumnName("storage_key").HasMaxLength(500);
            b.Property(e => e.Url).HasMaxLength(1000);
            b.Property(e => e.Note).HasMaxLength(500);
            b.HasOne<PlayerIdentityClaim>()
                .WithMany(c => c.Evidence)
                .HasForeignKey(e => e.ClaimId)
                .HasConstraintName("fk_verification_evidence_player_identity_claims_claim_id")
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Competition>(b =>
        {
            b.ToTable("reference_competitions");
            b.Property(x => x.CountryCode).HasMaxLength(8).IsRequired();
            b.Property(x => x.Name).HasMaxLength(200).IsRequired();
            b.Property(x => x.NameNormalized).HasMaxLength(200).IsRequired();
            b.Property(x => x.Type).HasMaxLength(50);
            b.Property(x => x.LogoUrl).HasMaxLength(500);

            b.HasIndex(x => x.ExternalCompetitionId)
                .IsUnique()
                .HasFilter("external_competition_id IS NOT NULL");
            b.HasIndex(x => new { x.CountryCode, x.NameNormalized });
            b.HasIndex(x => x.NameNormalized)
                .HasMethod("gin")
                .HasOperators("gin_trgm_ops");
            b.HasIndex(x => x.Status);
            b.HasIndex(x => new { x.SubmittedByUserId, x.Status });

            b.HasOne<Competition>()
                .WithMany()
                .HasForeignKey(x => x.MergedIntoCompetitionId)
                .HasConstraintName("fk_reference_competitions_merged_into")
                .OnDelete(DeleteBehavior.Restrict);
            b.HasOne<ApplicationUser>()
                .WithMany()
                .HasForeignKey(x => x.SubmittedByUserId)
                .HasConstraintName("fk_reference_competitions_submitted_by_user")
                .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<Team>(b =>
        {
            b.ToTable("reference_teams");
            b.Property(x => x.CountryCode).HasMaxLength(8).IsRequired();
            b.Property(x => x.Name).HasMaxLength(200).IsRequired();
            b.Property(x => x.NameNormalized).HasMaxLength(200).IsRequired();
            b.Property(x => x.Code).HasMaxLength(20);
            b.Property(x => x.LogoUrl).HasMaxLength(500);

            b.HasIndex(x => x.ExternalTeamId)
                .IsUnique()
                .HasFilter("external_team_id IS NOT NULL");
            b.HasIndex(x => new { x.CountryCode, x.NameNormalized });
            b.HasIndex(x => x.NameNormalized)
                .HasMethod("gin")
                .HasOperators("gin_trgm_ops");
            b.HasIndex(x => x.Status);
            b.HasIndex(x => new { x.SubmittedByUserId, x.Status });

            b.HasOne<Team>()
                .WithMany()
                .HasForeignKey(x => x.MergedIntoTeamId)
                .HasConstraintName("fk_reference_teams_merged_into")
                .OnDelete(DeleteBehavior.Restrict);
            b.HasOne<ApplicationUser>()
                .WithMany()
                .HasForeignKey(x => x.SubmittedByUserId)
                .HasConstraintName("fk_reference_teams_submitted_by_user")
                .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<CountrySyncState>(b =>
        {
            b.ToTable("reference_country_sync_states");
            b.HasKey(x => x.CountryCode);
            b.Property(x => x.CountryCode).HasMaxLength(8);

            b.HasOne<ApplicationUser>()
                .WithMany()
                .HasForeignKey(x => x.LastSyncedByUserId)
                .HasConstraintName("fk_reference_country_sync_states_last_synced_by_user")
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
