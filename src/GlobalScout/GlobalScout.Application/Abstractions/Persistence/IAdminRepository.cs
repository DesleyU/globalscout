using GlobalScout.Application.Users;
using GlobalScout.Domain.Identity;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Abstractions.Persistence;

public sealed record AdminListUsersCriteria(
    UserStatus? Status,
    string? Role,
    string? Search,
    int Page,
    int Limit);

public sealed record AdminUsersListResult(
    IReadOnlyList<AdminUserListItem> Users,
    AdminUsersPagination Pagination);

public sealed record AdminUserListItem(
    Guid Id,
    string Email,
    string Role,
    string Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    UserProfileApiDto? Profile,
    int ConnectionCount);

public sealed record AdminUsersPagination(int Page, int Limit, int Total, int Pages);

public sealed record AdminUserStatusSummary(
    Guid Id,
    string Email,
    string Role,
    string Status,
    UserProfileApiDto? Profile);

public sealed record AdminSystemStatsResult(AdminSystemStats Stats);

public sealed record AdminSystemStats(AdminUserStats Users, AdminConnectionStats Connections);

public sealed record AdminUserStats(
    int Total,
    int Active,
    int Blocked,
    AdminUserStatsByRole ByRole);

public sealed record AdminUserStatsByRole(int Players, int Clubs, int Scouts);

public sealed record AdminConnectionStats(int Total, int Accepted, int Pending);

public interface IAdminRepository
{
    Task<AdminUsersListResult> ListUsersAsync(AdminListUsersCriteria criteria, CancellationToken cancellationToken);

    Task<Result<AdminUserStatusSummary>> UpdateUserStatusAsync(
        Guid targetUserId,
        UserStatus newStatus,
        CancellationToken cancellationToken);

    Task<Result> DeleteUserAsync(Guid targetUserId, CancellationToken cancellationToken);

    Task<AdminSystemStatsResult> GetSystemStatsAsync(CancellationToken cancellationToken);
}
