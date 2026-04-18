using System.Text.Json;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Social;
using GlobalScout.Application.Users;
using GlobalScout.Domain.Identity;
using GlobalScout.Domain.Social;
using GlobalScout.Domain.Users;
using GlobalScout.Infrastructure.Data;
using GlobalScout.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace GlobalScout.Infrastructure.Social.Graph;

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

        var loaded = await db.Connections.AsNoTracking().FirstAsync(c => c.Id == entity.Id, cancellationToken);
        var users = await LoadUsersWithProfilesAsync(
            [loaded.SenderId, loaded.ReceiverId],
            cancellationToken);
        return await MapSendResponseAsync(loaded, users, cancellationToken);
    }

    public async Task<RespondToConnectionResponseDto?> RespondToPendingConnectionAsync(
        Guid connectionId,
        Guid receiverId,
        ConnectionStatus newStatus,
        CancellationToken cancellationToken)
    {
        var entity = await db.Connections
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

        var users = await LoadUsersWithProfilesAsync([entity.SenderId, entity.ReceiverId], cancellationToken);
        return await MapRespondResponseAsync(entity, users, cancellationToken);
    }

    public async Task<(IReadOnlyList<ConnectionListItemDto> Items, int Total)> GetConnectionsPageAsync(
        Guid userId,
        ConnectionStatus status,
        int page,
        int limit,
        CancellationToken cancellationToken)
    {
        var query = db.Connections.AsNoTracking()
            .Where(c => c.Status == status && (c.SenderId == userId || c.ReceiverId == userId));

        var total = await query.CountAsync(cancellationToken);
        var skip = (page - 1) * limit;
        var rows = await query
            .OrderByDescending(c => c.UpdatedAt)
            .Skip(skip)
            .Take(limit)
            .ToListAsync(cancellationToken);

        var userIds = rows.SelectMany(c => new[] { c.SenderId, c.ReceiverId }).Distinct().ToList();
        var usersDict = await LoadUsersWithProfilesAsync(userIds, cancellationToken);

        var items = new List<ConnectionListItemDto>(rows.Count);
        foreach (var c in rows)
        {
            var otherId = c.SenderId == userId ? c.ReceiverId : c.SenderId;
            if (!usersDict.TryGetValue(otherId, out ApplicationUser? other))
            {
                continue;
            }

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

        var userIds = rows.SelectMany(c => new[] { c.SenderId, c.ReceiverId }).Distinct().ToList();
        var usersDict = await LoadUsersWithProfilesAsync(userIds, cancellationToken);

        var items = new List<ConnectionRequestRowDto>(rows.Count);
        foreach (var c in rows)
        {
            if (!usersDict.TryGetValue(c.SenderId, out ApplicationUser? sender)
                || !usersDict.TryGetValue(c.ReceiverId, out ApplicationUser? receiver))
            {
                continue;
            }

            var senderRole = await GetRoleNameAsync(sender.Id, cancellationToken);
            var receiverRole = await GetRoleNameAsync(receiver.Id, cancellationToken);
            items.Add(
                new ConnectionRequestRowDto(
                    c.Id,
                    ConnectionStatusToApi(c.Status),
                    c.InvitationNote,
                    c.CreatedAt,
                    new ConnectionUserSummaryDto(sender.Id, senderRole, MapProfile(sender.Profile)),
                    new ConnectionUserSummaryDto(receiver.Id, receiverRole, MapProfile(receiver.Profile))));
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
            .Where(f => f.FollowingId == userId);

        var total = await query.CountAsync(cancellationToken);
        var skip = (page - 1) * limit;
        var rows = await query
            .OrderByDescending(f => f.CreatedAt)
            .Skip(skip)
            .Take(limit)
            .ToListAsync(cancellationToken);

        var followerIds = rows.Select(f => f.FollowerId).Distinct().ToList();
        var usersDict = await LoadUsersWithProfilesAsync(followerIds, cancellationToken);

        var items = new List<FollowListEntryDto>(rows.Count);
        foreach (var f in rows)
        {
            if (!usersDict.TryGetValue(f.FollowerId, out ApplicationUser? follower))
            {
                continue;
            }

            var role = await GetRoleNameAsync(follower.Id, cancellationToken);
            items.Add(
                new FollowListEntryDto(
                    f.Id,
                    new ConnectionUserSummaryDto(follower.Id, role, MapProfile(follower.Profile)),
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
            .Where(f => f.FollowerId == userId);

        var total = await query.CountAsync(cancellationToken);
        var skip = (page - 1) * limit;
        var rows = await query
            .OrderByDescending(f => f.CreatedAt)
            .Skip(skip)
            .Take(limit)
            .ToListAsync(cancellationToken);

        var followingIds = rows.Select(f => f.FollowingId).Distinct().ToList();
        var usersDict = await LoadUsersWithProfilesAsync(followingIds, cancellationToken);

        var items = new List<FollowListEntryDto>(rows.Count);
        foreach (var f in rows)
        {
            if (!usersDict.TryGetValue(f.FollowingId, out ApplicationUser? following))
            {
                continue;
            }

            var role = await GetRoleNameAsync(following.Id, cancellationToken);
            items.Add(
                new FollowListEntryDto(
                    f.Id,
                    new ConnectionUserSummaryDto(following.Id, role, MapProfile(following.Profile)),
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

    private async Task<Dictionary<Guid, ApplicationUser>> LoadUsersWithProfilesAsync(
        IReadOnlyCollection<Guid> userIds,
        CancellationToken cancellationToken)
    {
        if (userIds.Count == 0)
        {
            return new Dictionary<Guid, ApplicationUser>();
        }

        return await db.Users.AsNoTracking()
            .Include(u => u.Profile)
            .Where(u => userIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, cancellationToken);
    }

    private async Task<SendConnectionResponseDto?> MapSendResponseAsync(
        Connection c,
        IReadOnlyDictionary<Guid, ApplicationUser> users,
        CancellationToken cancellationToken)
    {
        if (!users.TryGetValue(c.SenderId, out ApplicationUser? sender)
            || !users.TryGetValue(c.ReceiverId, out ApplicationUser? receiver))
        {
            return null;
        }

        var senderRole = await GetRoleNameAsync(sender.Id, cancellationToken);
        var receiverRole = await GetRoleNameAsync(receiver.Id, cancellationToken);
        return new SendConnectionResponseDto(
            c.Id,
            ConnectionStatusToApi(c.Status),
            c.InvitationNote,
            c.CreatedAt,
            new ConnectionUserSummaryDto(sender.Id, senderRole, MapProfile(sender.Profile)),
            new ConnectionUserSummaryDto(receiver.Id, receiverRole, MapProfile(receiver.Profile)));
    }

    private async Task<RespondToConnectionResponseDto> MapRespondResponseAsync(
        Connection c,
        IReadOnlyDictionary<Guid, ApplicationUser> users,
        CancellationToken cancellationToken)
    {
        if (!users.TryGetValue(c.SenderId, out ApplicationUser? sender)
            || !users.TryGetValue(c.ReceiverId, out ApplicationUser? receiver))
        {
            throw new InvalidOperationException("Connection participants missing from store.");
        }

        var senderRole = await GetRoleNameAsync(sender.Id, cancellationToken);
        var receiverRole = await GetRoleNameAsync(receiver.Id, cancellationToken);
        return new RespondToConnectionResponseDto(
            c.Id,
            ConnectionStatusToApi(c.Status),
            c.InvitationNote,
            c.CreatedAt,
            c.UpdatedAt,
            new ConnectionUserSummaryDto(sender.Id, senderRole, MapProfile(sender.Profile)),
            new ConnectionUserSummaryDto(receiver.Id, receiverRole, MapProfile(receiver.Profile)));
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
