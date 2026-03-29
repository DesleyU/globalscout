using System.Text.Json;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Social;
using GlobalScout.Application.Users;
using GlobalScout.Domain.Identity;
using GlobalScout.Domain.Social;
using GlobalScout.Infrastructure.Data;
using GlobalScout.Infrastructure.Data.Entities;
using GlobalScout.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Connection = GlobalScout.Infrastructure.Data.Entities.Connection;

namespace GlobalScout.Infrastructure.Persistence;

internal sealed class SocialGraphRepository(
    GlobalScoutDbContext db,
    UserManager<ApplicationUser> userManager) : ISocialGraphRepository
{
    public async Task<AccountType?> GetAccountTypeAsync(Guid userId, CancellationToken cancellationToken)
    {
        var t = await db.Users.AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => (AccountType?)u.AccountType)
            .FirstOrDefaultAsync(cancellationToken);
        return t;
    }

    public async Task<bool> IsActiveUserAsync(Guid userId, CancellationToken cancellationToken) =>
        await db.Users.AsNoTracking()
            .AnyAsync(u => u.Id == userId && u.Status == UserStatus.Active, cancellationToken);

    public async Task<bool> UserExistsAsync(Guid userId, CancellationToken cancellationToken) =>
        await db.Users.AsNoTracking().AnyAsync(u => u.Id == userId, cancellationToken);

    public async Task<int> CountAcceptedConnectionsAsync(Guid userId, CancellationToken cancellationToken) =>
        await db.Connections.AsNoTracking()
            .CountAsync(
                c => c.Status == ConnectionStatus.Accepted
                     && (c.SenderId == userId || c.ReceiverId == userId),
                cancellationToken);

    public async Task<bool> ConnectionExistsAsync(Guid senderId, Guid receiverId, CancellationToken cancellationToken) =>
        await db.Connections.AsNoTracking()
            .AnyAsync(c => c.SenderId == senderId && c.ReceiverId == receiverId, cancellationToken);

    public async Task<SendConnectionResponseDto?> CreateConnectionAsync(
        Guid senderId,
        Guid receiverId,
        string? invitationNote,
        CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var entity = new Connection
        {
            Id = Guid.NewGuid(),
            SenderId = senderId,
            ReceiverId = receiverId,
            Status = ConnectionStatus.Pending,
            InvitationNote = invitationNote,
            CreatedAt = now,
            UpdatedAt = now
        };

        db.Connections.Add(entity);
        await db.SaveChangesAsync(cancellationToken);

        var loaded = await db.Connections
            .AsNoTracking()
            .Include(c => c.Sender).ThenInclude(s => s.Profile)
            .Include(c => c.Receiver).ThenInclude(r => r.Profile)
            .FirstAsync(c => c.Id == entity.Id, cancellationToken);

        return await MapSendResponseAsync(loaded, cancellationToken);
    }

    public async Task<RespondToConnectionResponseDto?> RespondToPendingConnectionAsync(
        Guid connectionId,
        Guid receiverId,
        ConnectionStatus newStatus,
        CancellationToken cancellationToken)
    {
        var entity = await db.Connections
            .Include(c => c.Sender).ThenInclude(s => s.Profile)
            .Include(c => c.Receiver).ThenInclude(r => r.Profile)
            .FirstOrDefaultAsync(
                c => c.Id == connectionId && c.ReceiverId == receiverId && c.Status == ConnectionStatus.Pending,
                cancellationToken);

        if (entity is null)
        {
            return null;
        }

        entity.Status = newStatus;
        entity.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);

        return await MapRespondResponseAsync(entity, cancellationToken);
    }

    public async Task<(IReadOnlyList<ConnectionListItemDto> Items, int Total)> GetConnectionsPageAsync(
        Guid userId,
        ConnectionStatus status,
        int page,
        int limit,
        CancellationToken cancellationToken)
    {
        var query = db.Connections.AsNoTracking()
            .Include(c => c.Sender).ThenInclude(s => s.Profile)
            .Include(c => c.Receiver).ThenInclude(r => r.Profile)
            .Where(c => c.Status == status && (c.SenderId == userId || c.ReceiverId == userId));

        var total = await query.CountAsync(cancellationToken);
        var skip = (page - 1) * limit;
        var rows = await query
            .OrderByDescending(c => c.UpdatedAt)
            .Skip(skip)
            .Take(limit)
            .ToListAsync(cancellationToken);

        var items = new List<ConnectionListItemDto>(rows.Count);
        foreach (var c in rows)
        {
            var other = c.SenderId == userId ? c.Receiver : c.Sender;
            var role = await GetRoleNameAsync(other.Id, cancellationToken);
            items.Add(
                new ConnectionListItemDto(
                    c.Id,
                    ConnectionStatusToApi(c.Status),
                    c.InvitationNote,
                    c.CreatedAt,
                    c.UpdatedAt,
                    new ConnectionUserSummaryDto(other.Id, role, MapProfile(other.Profile))));
        }

        return (items, total);
    }

    public async Task<(IReadOnlyList<ConnectionRequestRowDto> Items, int Total)> GetPendingRequestsPageAsync(
        Guid userId,
        bool received,
        int page,
        int limit,
        CancellationToken cancellationToken)
    {
        IQueryable<Connection> query = db.Connections.AsNoTracking()
            .Include(c => c.Sender).ThenInclude(s => s.Profile)
            .Include(c => c.Receiver).ThenInclude(r => r.Profile)
            .Where(c => c.Status == ConnectionStatus.Pending);

        query = received
            ? query.Where(c => c.ReceiverId == userId)
            : query.Where(c => c.SenderId == userId);

        var total = await query.CountAsync(cancellationToken);
        var skip = (page - 1) * limit;
        var rows = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip(skip)
            .Take(limit)
            .ToListAsync(cancellationToken);

        var items = new List<ConnectionRequestRowDto>(rows.Count);
        foreach (var c in rows)
        {
            var senderRole = await GetRoleNameAsync(c.Sender.Id, cancellationToken);
            var receiverRole = await GetRoleNameAsync(c.Receiver.Id, cancellationToken);
            items.Add(
                new ConnectionRequestRowDto(
                    c.Id,
                    ConnectionStatusToApi(c.Status),
                    c.InvitationNote,
                    c.CreatedAt,
                    new ConnectionUserSummaryDto(c.Sender.Id, senderRole, MapProfile(c.Sender.Profile)),
                    new ConnectionUserSummaryDto(c.Receiver.Id, receiverRole, MapProfile(c.Receiver.Profile))));
        }

        return (items, total);
    }

    public async Task<bool> FollowExistsAsync(Guid followerId, Guid followingId, CancellationToken cancellationToken) =>
        await db.Follows.AsNoTracking()
            .AnyAsync(f => f.FollowerId == followerId && f.FollowingId == followingId, cancellationToken);

    public async Task<FollowUserResponseDto?> CreateFollowAsync(
        Guid followerId,
        Guid followingId,
        CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var entity = new Follow
        {
            Id = Guid.NewGuid(),
            FollowerId = followerId,
            FollowingId = followingId,
            CreatedAt = now
        };

        db.Follows.Add(entity);
        await db.SaveChangesAsync(cancellationToken);

        var following = await db.Users.AsNoTracking()
            .Include(u => u.Profile)
            .FirstAsync(u => u.Id == followingId, cancellationToken);

        var role = await GetRoleNameAsync(following.Id, cancellationToken);
        return new FollowUserResponseDto(
            entity.Id,
            new FollowingUserDto(following.Id, role, MapProfile(following.Profile)),
            entity.CreatedAt);
    }

    public async Task<bool> DeleteFollowAsync(Guid followerId, Guid followingId, CancellationToken cancellationToken)
    {
        var row = await db.Follows.FirstOrDefaultAsync(
            f => f.FollowerId == followerId && f.FollowingId == followingId,
            cancellationToken);
        if (row is null)
        {
            return false;
        }

        db.Follows.Remove(row);
        await db.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<(IReadOnlyList<FollowListEntryDto> Items, int Total)> GetFollowersPageAsync(
        Guid userId,
        int page,
        int limit,
        CancellationToken cancellationToken)
    {
        var query = db.Follows.AsNoTracking()
            .Include(f => f.Follower).ThenInclude(u => u.Profile)
            .Where(f => f.FollowingId == userId);

        var total = await query.CountAsync(cancellationToken);
        var skip = (page - 1) * limit;
        var rows = await query
            .OrderByDescending(f => f.CreatedAt)
            .Skip(skip)
            .Take(limit)
            .ToListAsync(cancellationToken);

        var items = new List<FollowListEntryDto>(rows.Count);
        foreach (var f in rows)
        {
            var role = await GetRoleNameAsync(f.Follower.Id, cancellationToken);
            items.Add(
                new FollowListEntryDto(
                    f.Id,
                    new ConnectionUserSummaryDto(f.Follower.Id, role, MapProfile(f.Follower.Profile)),
                    f.CreatedAt));
        }

        return (items, total);
    }

    public async Task<(IReadOnlyList<FollowListEntryDto> Items, int Total)> GetFollowingPageAsync(
        Guid userId,
        int page,
        int limit,
        CancellationToken cancellationToken)
    {
        var query = db.Follows.AsNoTracking()
            .Include(f => f.Following).ThenInclude(u => u.Profile)
            .Where(f => f.FollowerId == userId);

        var total = await query.CountAsync(cancellationToken);
        var skip = (page - 1) * limit;
        var rows = await query
            .OrderByDescending(f => f.CreatedAt)
            .Skip(skip)
            .Take(limit)
            .ToListAsync(cancellationToken);

        var items = new List<FollowListEntryDto>(rows.Count);
        foreach (var f in rows)
        {
            var role = await GetRoleNameAsync(f.Following.Id, cancellationToken);
            items.Add(
                new FollowListEntryDto(
                    f.Id,
                    new ConnectionUserSummaryDto(f.Following.Id, role, MapProfile(f.Following.Profile)),
                    f.CreatedAt));
        }

        return (items, total);
    }

    public async Task<(bool IsFollowing, Guid? FollowId)> GetFollowStatusAsync(
        Guid followerId,
        Guid followingId,
        CancellationToken cancellationToken)
    {
        var row = await db.Follows.AsNoTracking()
            .Where(f => f.FollowerId == followerId && f.FollowingId == followingId)
            .Select(f => new { f.Id })
            .FirstOrDefaultAsync(cancellationToken);

        return row is null ? (false, null) : (true, row.Id);
    }

    public async Task<(int FollowersCount, int FollowingCount)> GetFollowCountsAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var followers = await db.Follows.AsNoTracking()
            .CountAsync(f => f.FollowingId == userId, cancellationToken);
        var following = await db.Follows.AsNoTracking()
            .CountAsync(f => f.FollowerId == userId, cancellationToken);
        return (followers, following);
    }

    private async Task<SendConnectionResponseDto?> MapSendResponseAsync(
        Connection c,
        CancellationToken cancellationToken)
    {
        var senderRole = await GetRoleNameAsync(c.Sender.Id, cancellationToken);
        var receiverRole = await GetRoleNameAsync(c.Receiver.Id, cancellationToken);
        return new SendConnectionResponseDto(
            c.Id,
            ConnectionStatusToApi(c.Status),
            c.InvitationNote,
            c.CreatedAt,
            new ConnectionUserSummaryDto(c.Sender.Id, senderRole, MapProfile(c.Sender.Profile)),
            new ConnectionUserSummaryDto(c.Receiver.Id, receiverRole, MapProfile(c.Receiver.Profile)));
    }

    private async Task<RespondToConnectionResponseDto> MapRespondResponseAsync(
        Connection c,
        CancellationToken cancellationToken)
    {
        var senderRole = await GetRoleNameAsync(c.Sender.Id, cancellationToken);
        var receiverRole = await GetRoleNameAsync(c.Receiver.Id, cancellationToken);
        return new RespondToConnectionResponseDto(
            c.Id,
            ConnectionStatusToApi(c.Status),
            c.InvitationNote,
            c.CreatedAt,
            c.UpdatedAt,
            new ConnectionUserSummaryDto(c.Sender.Id, senderRole, MapProfile(c.Sender.Profile)),
            new ConnectionUserSummaryDto(c.Receiver.Id, receiverRole, MapProfile(c.Receiver.Profile)));
    }

    private async Task<string> GetRoleNameAsync(Guid userId, CancellationToken cancellationToken)
    {
        var userEntity = await userManager.FindByIdAsync(userId.ToString());
        if (userEntity is null)
        {
            return AppRoleNames.Player;
        }

        var roles = await userManager.GetRolesAsync(userEntity);
        return roles.FirstOrDefault() ?? AppRoleNames.Player;
    }

    private static string ConnectionStatusToApi(ConnectionStatus s) =>
        s switch
        {
            ConnectionStatus.Pending => "PENDING",
            ConnectionStatus.Accepted => "ACCEPTED",
            ConnectionStatus.Rejected => "REJECTED",
            _ => s.ToString().ToUpperInvariant()
        };

    private static UserProfileApiDto? MapProfile(Profile? p)
    {
        if (p is null)
        {
            return null;
        }

        object? stats = null;
        if (p.StatsData is not null)
        {
            stats = JsonSerializer.Deserialize<JsonElement>(p.StatsData.RootElement.GetRawText());
        }

        return new UserProfileApiDto(
            p.UserId,
            p.FirstName,
            p.LastName,
            p.Avatar,
            p.Bio,
            PositionToApi(p.Position),
            p.Age,
            p.Height,
            p.Weight,
            p.Nationality,
            p.ClubName,
            p.ClubLogo,
            p.Phone,
            p.Website,
            p.Instagram,
            p.Twitter,
            p.Linkedin,
            p.Country,
            p.City,
            stats,
            p.CreatedAt,
            p.UpdatedAt);
    }

    private static string? PositionToApi(GlobalScout.Domain.Identity.Position? position) =>
        position switch
        {
            null => null,
            GlobalScout.Domain.Identity.Position.Goalkeeper => "GOALKEEPER",
            GlobalScout.Domain.Identity.Position.Defender => "DEFENDER",
            GlobalScout.Domain.Identity.Position.Midfielder => "MIDFIELDER",
            GlobalScout.Domain.Identity.Position.Forward => "FORWARD",
            _ => null
        };
}
