using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Domain.Identity;
using GlobalScout.SharedKernel;

using static GlobalScout.Application.Admin.AdminErrors;

namespace GlobalScout.Application.Admin.ListUsers;

internal sealed class ListAdminUsersQueryHandler(IAdminRepository admin)
    : IQueryHandler<ListAdminUsersQuery, AdminUsersListResult>
{
    public async Task<Result<AdminUsersListResult>> Handle(ListAdminUsersQuery query, CancellationToken cancellationToken)
    {
        UserStatus? statusFilter = null;
        if (!string.IsNullOrWhiteSpace(query.Status))
        {
            if (!AdminUserStatusParser.TryParse(query.Status, out var parsed))
            {
                return Result.Failure<AdminUsersListResult>(InvalidStatus());
            }

            statusFilter = parsed;
        }

        var page = query.Page < 1 ? 1 : query.Page;
        var limit = query.Limit < 1 ? 20 : Math.Min(query.Limit, 100);

        var criteria = new AdminListUsersCriteria(
            statusFilter,
            query.Role,
            query.Search,
            page,
            limit);

        var result = await admin.ListUsersAsync(criteria, cancellationToken);
        return Result.Success(result);
    }
}
