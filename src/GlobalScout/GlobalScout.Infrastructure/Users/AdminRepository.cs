using System.Text.Json;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Users;
using GlobalScout.Domain.Identity;
using GlobalScout.Domain.Social;
using GlobalScout.Domain.Users;
using GlobalScout.Infrastructure.Data;
using GlobalScout.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using GlobalScout.SharedKernel;
using AdminErrors = GlobalScout.Application.Admin.AdminErrors;

namespace GlobalScout.Infrastructure.Users;

internal sealed class AdminRepository(
    GlobalScoutDbContext db,
    UserManager<ApplicationUser> userManager) : IAdminRepository
{
    public async Task<AdminUsersListResult> ListUsersAsync(
        AdminListUsersCriteria c,
        CancellationToken cancellationToken)
    {
        IQueryable<ApplicationUser> query = db.Users.AsNoTracking().Include(u => u.Profile);

        if (c.Status is not null)
        {
            query = query.Where(u => u.Status == c.Status.Value);
        }

        if (!string.IsNullOrWhiteSpace(c.Role))
        {
            var normalized = c.Role.Trim().ToUpperInvariant();
            var userIdsInRole = await (
                from ur in db.UserRoles
                join role in db.Roles on ur.RoleId equals role.Id
                where role.NormalizedName == normalized
                select ur.UserId).Distinct().ToListAsync(cancellationToken);

            query = query.Where(u => userIdsInRole.Contains(u.Id));
        }

        if (!string.IsNullOrWhiteSpace(c.Search))
        {
            var term = c.Search.Trim();
            query = query.Where(u =>
                (u.Email != null && EF.Functions.ILike(u.Email, $"%{term}%"))
                || (u.Profile != null &&
                    ((u.Profile.FirstName != null && EF.Functions.ILike(u.Profile.FirstName, $"%{term}%"))
                     || (u.Profile.LastName != null && EF.Functions.ILike(u.Profile.LastName, $"%{term}%")))));
        }

        var total = await query.CountAsync(cancellationToken);
        var skip = (c.Page - 1) * c.Limit;
        var users = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip(skip)
            .Take(c.Limit)
            .ToListAsync(cancellationToken);

        if (users.Count == 0)
        {
            return new AdminUsersListResult(
                [],
                new AdminUsersPagination(c.Page, c.Limit, total, (int)Math.Ceiling(total / (double)c.Limit)));
        }

        var ids = users.Select(u => u.Id).ToList();

        var senderCounts = await db.Connections.AsNoTracking()
            .Where(x => ids.Contains(x.SenderId))
            .GroupBy(x => x.SenderId)
            .Select(g => new { UserId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.UserId, x => x.Count, cancellationToken);

        var receiverCounts = await db.Connections.AsNoTracking()
            .Where(x => ids.Contains(x.ReceiverId))
            .GroupBy(x => x.ReceiverId)
            .Select(g => new { UserId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.UserId, x => x.Count, cancellationToken);

        var items = new List<AdminUserListItem>();
        foreach (var u in users)
        {
            var roleName = await GetRoleNameAsync(u.Id, cancellationToken);
            var cc = senderCounts.GetValueOrDefault(u.Id) + receiverCounts.GetValueOrDefault(u.Id);
            items.Add(new AdminUserListItem(
                u.Id,
                u.Email ?? string.Empty,
                roleName,
                UserStatusToApi(u.Status),
                u.CreatedAt,
                u.UpdatedAt,
                MapProfile(u.Profile),
                cc));
        }

        var pages = (int)Math.Ceiling(total / (double)c.Limit);
        return new AdminUsersListResult(items, new AdminUsersPagination(c.Page, c.Limit, total, pages));
    }

    public async Task<Result<AdminUserStatusSummary>> UpdateUserStatusAsync(
        Guid targetUserId,
        UserStatus newStatus,
        CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(targetUserId.ToString());
        if (user is null)
        {
            return Result.Failure<AdminUserStatusSummary>(AdminErrors.UserNotFound());
        }

        user.Status = newStatus;
        user.UpdatedAt = DateTimeOffset.UtcNow;
        var updateResult = await userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            var msg = string.Join(", ", updateResult.Errors.Select(e => e.Description));
            return Result.Failure<AdminUserStatusSummary>(Error.Problem("Admin.UpdateFailed", msg));
        }

        var profile = await db.Profiles.AsNoTracking()
            .FirstOrDefaultAsync(p => p.UserId == targetUserId, cancellationToken);
        var roleName = await GetRoleNameAsync(user, cancellationToken);
        var summary = new AdminUserStatusSummary(
            user.Id,
            user.Email ?? string.Empty,
            roleName,
            UserStatusToApi(user.Status),
            MapProfile(profile));

        return Result.Success(summary);
    }

    public async Task<Result> DeleteUserAsync(Guid targetUserId, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(targetUserId.ToString());
        if (user is null)
        {
            return Result.Failure(AdminErrors.UserNotFound());
        }

        await using var tx = await db.Database.BeginTransactionAsync(cancellationToken);

        await db.Messages.Where(m => m.SenderId == targetUserId || m.ReceiverId == targetUserId)
            .ExecuteDeleteAsync(cancellationToken);

        await db.Connections.Where(c => c.SenderId == targetUserId || c.ReceiverId == targetUserId)
            .ExecuteDeleteAsync(cancellationToken);

        await db.Follows.Where(f => f.FollowerId == targetUserId || f.FollowingId == targetUserId)
            .ExecuteDeleteAsync(cancellationToken);

        await db.ProfileVisits.Where(v => v.ProfileOwnerId == targetUserId || v.VisitorId == targetUserId)
            .ExecuteDeleteAsync(cancellationToken);

        await db.UserBlocks.Where(b => b.BlockerId == targetUserId || b.BlockedId == targetUserId)
            .ExecuteDeleteAsync(cancellationToken);

        var deleteResult = await userManager.DeleteAsync(user);
        if (!deleteResult.Succeeded)
        {
            await tx.RollbackAsync(cancellationToken);
            var msg = string.Join(", ", deleteResult.Errors.Select(e => e.Description));
            return Result.Failure(Error.Problem("Admin.DeleteFailed", msg));
        }

        await tx.CommitAsync(cancellationToken);
        return Result.Success();
    }

    public async Task<AdminSystemStatsResult> GetSystemStatsAsync(CancellationToken cancellationToken)
    {
        var totalUsers = await db.Users.CountAsync(cancellationToken);
        var activeUsers = await db.Users.CountAsync(u => u.Status == UserStatus.Active, cancellationToken);
        var blockedUsers = await db.Users.CountAsync(u => u.Status == UserStatus.Blocked, cancellationToken);

        var playerCount = await CountUsersInRoleAsync(AppRoleNames.Player, cancellationToken);
        var clubCount = await CountUsersInRoleAsync(AppRoleNames.Club, cancellationToken);
        var scoutCount = await CountUsersInRoleAsync(AppRoleNames.ScoutAgent, cancellationToken);

        var totalConnections = await db.Connections.CountAsync(cancellationToken);
        var acceptedConnections = await db.Connections.CountAsync(
            c => c.Status == ConnectionStatus.Accepted,
            cancellationToken);
        var pendingConnections = await db.Connections.CountAsync(
            c => c.Status == ConnectionStatus.Pending,
            cancellationToken);

        return new AdminSystemStatsResult(
            new AdminSystemStats(
                new AdminUserStats(
                    totalUsers,
                    activeUsers,
                    blockedUsers,
                    new AdminUserStatsByRole(playerCount, clubCount, scoutCount)),
                new AdminConnectionStats(totalConnections, acceptedConnections, pendingConnections)));
    }

    private Task<int> CountUsersInRoleAsync(string roleName, CancellationToken cancellationToken)
    {
        var normalized = roleName.ToUpperInvariant();
        return (
            from ur in db.UserRoles
            join r in db.Roles on ur.RoleId equals r.Id
            where r.NormalizedName == normalized
            select ur.UserId).Distinct().CountAsync(cancellationToken);
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

    private async Task<string> GetRoleNameAsync(ApplicationUser user, CancellationToken cancellationToken)
    {
        var roles = await userManager.GetRolesAsync(user);
        return roles.FirstOrDefault() ?? AppRoleNames.Player;
    }

    private static string UserStatusToApi(UserStatus s) => s.ToString().ToUpperInvariant();

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

    private static string? PositionToApi(Position? position) =>
        position switch
        {
            null => null,
            Position.Goalkeeper => "GOALKEEPER",
            Position.Defender => "DEFENDER",
            Position.Midfielder => "MIDFIELDER",
            Position.Forward => "FORWARD",
            _ => null
        };
}
