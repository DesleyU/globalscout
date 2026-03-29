using System.Text.Json;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Users;
using GlobalScout.Domain.Identity;
using GlobalScout.Infrastructure.Data;
using GlobalScout.Domain.Users;
using GlobalScout.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
namespace GlobalScout.Infrastructure.Users;

internal sealed class UserDirectoryRepository(
    GlobalScoutDbContext db,
    UserManager<ApplicationUser> userManager) : IUserDirectoryRepository
{
    public async Task<UsersFullProfileResult?> GetFullProfileAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await db.Users.AsNoTracking().Include(u => u.Profile).FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        if (user is null)
        {
            return null;
        }

        return await MapToFullProfileAsync(user, cancellationToken);
    }

    public async Task UpdateProfileFieldsAsync(Guid userId, ProfileFieldPatch patch, CancellationToken cancellationToken)
    {
        var profile = await db.Profiles.FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);
        if (profile is null)
        {
            return;
        }

        if (patch.FirstName is not null)
        {
            profile.FirstName = patch.FirstName;
        }

        if (patch.LastName is not null)
        {
            profile.LastName = patch.LastName;
        }

        if (patch.Bio is not null)
        {
            profile.Bio = patch.Bio;
        }

        if (patch.Position is not null && TryParsePosition(patch.Position, out var pos))
        {
            profile.Position = pos;
        }

        if (patch.Age is not null)
        {
            profile.Age = patch.Age;
        }

        if (patch.Height is not null)
        {
            profile.Height = patch.Height;
        }

        if (patch.Weight is not null)
        {
            profile.Weight = patch.Weight;
        }

        if (patch.Nationality is not null)
        {
            profile.Nationality = patch.Nationality;
        }

        if (patch.ClubName is not null)
        {
            profile.ClubName = patch.ClubName;
        }

        if (patch.ClubLogo is not null)
        {
            profile.ClubLogo = patch.ClubLogo;
        }

        if (patch.Phone is not null)
        {
            profile.Phone = patch.Phone;
        }

        if (patch.Website is not null)
        {
            profile.Website = patch.Website;
        }

        if (patch.Instagram is not null)
        {
            profile.Instagram = patch.Instagram;
        }

        if (patch.Twitter is not null)
        {
            profile.Twitter = patch.Twitter;
        }

        if (patch.Linkedin is not null)
        {
            profile.Linkedin = patch.Linkedin;
        }

        if (patch.Country is not null)
        {
            profile.Country = patch.Country;
        }

        if (patch.City is not null)
        {
            profile.City = patch.City;
        }

        if (patch.StatsData is not null)
        {
            profile.StatsData = patch.StatsData;
        }

        profile.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task SetPlayerIdAsync(Guid userId, int? playerId, CancellationToken cancellationToken)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        if (user is null)
        {
            return;
        }

        user.PlayerId = playerId;
        user.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<bool> PlayerIdExistsForAnotherUserAsync(
        int playerId,
        Guid exceptUserId,
        CancellationToken cancellationToken) =>
        await db.Users.AnyAsync(
            u => u.PlayerId == playerId && u.Id != exceptUserId,
            cancellationToken);

    public async Task<SearchUsersResult> SearchUsersAsync(SearchUsersCriteria c, CancellationToken cancellationToken)
    {
        IQueryable<ApplicationUser> query = db.Users
            .AsNoTracking()
            .Include(u => u.Profile)
            .Where(u => u.Id != c.ExcludeUserId && u.Status == UserStatus.Active);

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

        if (!string.IsNullOrWhiteSpace(c.Position) && TryParsePosition(c.Position.Trim().ToUpperInvariant(), out var position))
        {
            query = query.Where(u => u.Profile != null && u.Profile.Position == position);
        }

        if (!string.IsNullOrWhiteSpace(c.Club))
        {
            var term = c.Club.Trim();
            query = query.Where(u => u.Profile != null && u.Profile.ClubName != null && EF.Functions.ILike(u.Profile.ClubName, $"%{term}%"));
        }

        if (!string.IsNullOrWhiteSpace(c.Country))
        {
            var term = c.Country.Trim();
            query = query.Where(u => u.Profile != null && u.Profile.Country != null && EF.Functions.ILike(u.Profile.Country, $"%{term}%"));
        }

        if (!string.IsNullOrWhiteSpace(c.City))
        {
            var term = c.City.Trim();
            query = query.Where(u => u.Profile != null && u.Profile.City != null && EF.Functions.ILike(u.Profile.City, $"%{term}%"));
        }

        if (c.MinAge is not null || c.MaxAge is not null)
        {
            query = query.Where(u => u.Profile != null && u.Profile.Age != null);
            if (c.MinAge is not null)
            {
                query = query.Where(u => u.Profile!.Age >= c.MinAge);
            }

            if (c.MaxAge is not null)
            {
                query = query.Where(u => u.Profile!.Age <= c.MaxAge);
            }
        }

        if (!string.IsNullOrWhiteSpace(c.Search))
        {
            var term = c.Search.Trim();
            query = query.Where(u =>
                u.Profile != null &&
                ((u.Profile.FirstName != null && EF.Functions.ILike(u.Profile.FirstName, $"%{term}%"))
                 || (u.Profile.LastName != null && EF.Functions.ILike(u.Profile.LastName, $"%{term}%"))
                 || (u.Profile.ClubName != null && EF.Functions.ILike(u.Profile.ClubName, $"%{term}%"))));
        }

        var total = await query.CountAsync(cancellationToken);
        var skip = (c.Page - 1) * c.Limit;
        var users = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip(skip)
            .Take(c.Limit)
            .ToListAsync(cancellationToken);

        var items = new List<SearchUserItem>();
        foreach (var u in users)
        {
            var roleName = await GetRoleNameAsync(u.Id, cancellationToken);
            items.Add(new SearchUserItem(u.Id, roleName, AccountTypeToApi(u.AccountType), MapProfile(u.Profile)));
        }

        var pages = (int)Math.Ceiling(total / (double)c.Limit);
        return new SearchUsersResult(
            items,
            new SearchUsersPagination(c.Page, c.Limit, total, pages));
    }

    public async Task<IReadOnlyList<SearchUserItem>> GetRecommendationsAsync(
        Guid currentUserId,
        UserRole currentRole,
        int limit,
        CancellationToken cancellationToken)
    {
        var roleFilters = RecommendationRoles(currentRole);
        if (roleFilters.Count == 0)
        {
            return [];
        }

        var asSender = await db.Connections.AsNoTracking()
            .Where(x => x.SenderId == currentUserId)
            .Select(x => x.ReceiverId)
            .ToListAsync(cancellationToken);

        var asReceiver = await db.Connections.AsNoTracking()
            .Where(x => x.ReceiverId == currentUserId)
            .Select(x => x.SenderId)
            .ToListAsync(cancellationToken);

        var connectedIds = asSender.Concat(asReceiver).Where(id => id != currentUserId).Distinct().ToList();

        var excluded = connectedIds.Append(currentUserId).ToHashSet();

        var candidateRoleNames = roleFilters.Select(UserRoleToNormalizedName).ToList();

        var candidateUserIds = await (
            from ur in db.UserRoles
            join role in db.Roles on ur.RoleId equals role.Id
            where role.NormalizedName != null && candidateRoleNames.Contains(role.NormalizedName)
            select ur.UserId).Distinct().ToListAsync(cancellationToken);

        var filteredIds = candidateUserIds.Where(id => !excluded.Contains(id)).ToList();

        var users = await db.Users.AsNoTracking()
            .Include(u => u.Profile)
            .Where(u => filteredIds.Contains(u.Id) && u.Status == UserStatus.Active)
            .OrderByDescending(u => u.CreatedAt)
            .Take(limit)
            .ToListAsync(cancellationToken);

        var list = new List<SearchUserItem>();
        foreach (var u in users)
        {
            var roleName = await GetRoleNameAsync(u.Id, cancellationToken);
            list.Add(new SearchUserItem(u.Id, roleName, AccountTypeToApi(u.AccountType), MapProfile(u.Profile)));
        }

        return list;
    }

    public async Task UpsertProfileVisitAsync(
        Guid profileOwnerId,
        Guid visitorId,
        UserRole visitorRole,
        CancellationToken cancellationToken)
    {
        var existing = await db.ProfileVisits.FirstOrDefaultAsync(
            v => v.ProfileOwnerId == profileOwnerId && v.VisitorId == visitorId,
            cancellationToken);

        if (existing is not null)
        {
            existing.CreatedAt = DateTimeOffset.UtcNow;
            existing.VisitorRole = visitorRole;
        }
        else
        {
            db.ProfileVisits.Add(new ProfileVisit
            {
                Id = Guid.NewGuid(),
                ProfileOwnerId = profileOwnerId,
                VisitorId = visitorId,
                VisitorRole = visitorRole,
                CreatedAt = DateTimeOffset.UtcNow
            });
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<PublicUserProfileResult?> GetActivePublicUserAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await db.Users.AsNoTracking()
            .Include(u => u.Profile)
            .FirstOrDefaultAsync(u => u.Id == userId && u.Status == UserStatus.Active, cancellationToken);

        if (user is null)
        {
            return null;
        }

        var roleName = await GetRoleNameAsync(user, cancellationToken);
        var tier = AccountTypeToApi(user.AccountType);
        return new PublicUserProfileResult(
            user.Id,
            roleName,
            tier,
            user.AccountType,
            MapProfile(user.Profile),
            tier);
    }

    public async Task<GetProfileVisitorsResult> GetProfileVisitorsAsync(
        Guid profileOwnerId,
        bool premiumDetails,
        CancellationToken cancellationToken)
    {
        var roleRows = await db.ProfileVisits.AsNoTracking()
            .Where(v => v.ProfileOwnerId == profileOwnerId)
            .Select(v => v.VisitorRole)
            .ToListAsync(cancellationToken);

        var stats = roleRows
            .GroupBy(r => r)
            .Select(g => new VisitorTypeCount(UserRoleToApiString(g.Key), g.Count()))
            .ToList();

        var total = roleRows.Count;

        if (!premiumDetails)
        {
            return new GetProfileVisitorsResult(
                "BASIC",
                "Upgrade to Premium to see detailed visitor information",
                stats,
                total,
                Visitors: null);
        }

        return await BuildPremiumVisitorsAsync(profileOwnerId, stats, cancellationToken);
    }

    public async Task SetAvatarAsync(Guid userId, string avatarUrl, CancellationToken cancellationToken)
    {
        var profile = await db.Profiles.FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);
        if (profile is null)
        {
            return;
        }

        profile.Avatar = avatarUrl;
        profile.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
    }

    private async Task<GetProfileVisitorsResult> BuildPremiumVisitorsAsync(
        Guid profileOwnerId,
        IReadOnlyList<VisitorTypeCount> stats,
        CancellationToken cancellationToken)
    {
        var visits = await db.ProfileVisits.AsNoTracking()
            .Where(v => v.ProfileOwnerId == profileOwnerId)
            .OrderByDescending(v => v.CreatedAt)
            .Take(50)
            .ToListAsync(cancellationToken);

        var visitorIds = visits.Select(v => v.VisitorId).Distinct().ToList();
        var usersDict = await db.Users.AsNoTracking()
            .Include(u => u.Profile)
            .Where(u => visitorIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, cancellationToken);
        var roleMap = await GetRoleNamesForUsersAsync(visitorIds, cancellationToken);

        var entries = visits.Select(v =>
        {
            usersDict.TryGetValue(v.VisitorId, out ApplicationUser? visitor);
            var p = visitor?.Profile;
            roleMap.TryGetValue(v.VisitorId, out var roleName);
            roleName ??= AppRoleNames.Player;
            return new ProfileVisitorEntry(
                v.Id,
                UserRoleToApiString(v.VisitorRole),
                v.CreatedAt,
                new VisitorSummary(
                    v.VisitorId,
                    roleName,
                    new VisitorProfileSnippet(
                        p?.FirstName,
                        p?.LastName,
                        p?.Avatar,
                        p?.ClubName)));
        }).ToList();

        return new GetProfileVisitorsResult("PREMIUM", null, stats, entries.Count, entries);
    }

    private async Task<Dictionary<Guid, string>> GetRoleNamesForUsersAsync(
        IReadOnlyCollection<Guid> userIds,
        CancellationToken cancellationToken)
    {
        if (userIds.Count == 0)
        {
            return new Dictionary<Guid, string>();
        }

        var rows = await (
            from ur in db.UserRoles
            join role in db.Roles on ur.RoleId equals role.Id
            where userIds.Contains(ur.UserId)
            select new { ur.UserId, role.Name }).ToListAsync(cancellationToken);

        return rows.GroupBy(x => x.UserId).ToDictionary(g => g.Key, g => g.First().Name ?? AppRoleNames.Player);
    }

    private static string UserRoleToApiString(UserRole role) =>
        role switch
        {
            UserRole.Player => AppRoleNames.Player,
            UserRole.Club => AppRoleNames.Club,
            UserRole.ScoutAgent => AppRoleNames.ScoutAgent,
            UserRole.Admin => AppRoleNames.Admin,
            _ => AppRoleNames.Player
        };

    private static string UserRoleToNormalizedName(UserRole role) => UserRoleToApiString(role).ToUpperInvariant();

    private static List<UserRole> RecommendationRoles(UserRole current) =>
        current switch
        {
            UserRole.Player => [UserRole.ScoutAgent, UserRole.Club],
            UserRole.ScoutAgent => [UserRole.Player, UserRole.Club],
            UserRole.Club => [UserRole.Player, UserRole.ScoutAgent],
            _ => []
        };

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

    private async Task<UsersFullProfileResult?> MapToFullProfileAsync(ApplicationUser user, CancellationToken cancellationToken)
    {
        var roleName = await GetRoleNameAsync(user, cancellationToken);
        return new UsersFullProfileResult(
            user.Id,
            user.Email ?? string.Empty,
            roleName,
            UserStatusToApi(user.Status),
            AccountTypeToApi(user.AccountType),
            user.PlayerId,
            MapProfile(user.Profile),
            user.CreatedAt,
            user.UpdatedAt);
    }

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

    private static string UserStatusToApi(UserStatus s) => s.ToString().ToUpperInvariant();

    private static string AccountTypeToApi(AccountType a) => a.ToString().ToUpperInvariant();

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

    private static bool TryParsePosition(string value, out Position position)
    {
        position = default;
        return value.ToUpperInvariant() switch
        {
            "GOALKEEPER" => TrySet(Position.Goalkeeper, out position),
            "DEFENDER" => TrySet(Position.Defender, out position),
            "MIDFIELDER" => TrySet(Position.Midfielder, out position),
            "FORWARD" => TrySet(Position.Forward, out position),
            _ => false
        };
    }

    private static bool TrySet(Position p, out Position position)
    {
        position = p;
        return true;
    }
}
