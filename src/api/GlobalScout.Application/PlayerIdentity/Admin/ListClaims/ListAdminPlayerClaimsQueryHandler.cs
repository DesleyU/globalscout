using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Domain.PlayerIdentity;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.PlayerIdentity.Admin.ListClaims;

internal sealed class ListAdminPlayerClaimsQueryHandler(
    IPlayerIdentityClaimRepository claims,
    IUserDirectoryRepository users)
    : IQueryHandler<ListAdminPlayerClaimsQuery, ListAdminPlayerClaimsResult>
{
    public async Task<Result<ListAdminPlayerClaimsResult>> Handle(
        ListAdminPlayerClaimsQuery query,
        CancellationToken cancellationToken)
    {
        ClaimStatus? statusFilter = null;
        if (!string.IsNullOrWhiteSpace(query.Status))
        {
            if (!Enum.TryParse(query.Status.Trim(), ignoreCase: true, out ClaimStatus parsed))
            {
                return Result.Failure<ListAdminPlayerClaimsResult>(PlayerIdentityErrors.InvalidClaimStatus);
            }

            statusFilter = parsed;
        }

        var page = query.Page < 1 ? 1 : query.Page;
        var limit = query.Limit < 1 ? 20 : Math.Min(query.Limit, 100);

        var pageResult = await claims.ListForAdminAsync(
            new AdminPlayerClaimsListCriteria(statusFilter, query.Search, page, limit),
            cancellationToken);

        var items = new List<AdminPendingClaimItem>(pageResult.Claims.Count);
        foreach (var claim in pageResult.Claims)
        {
            var profile = await users.GetFullProfileAsync(claim.UserId, cancellationToken);
            var fullName = profile?.Profile is null
                ? null
                : $"{profile.Profile.FirstName} {profile.Profile.LastName}".Trim();

            items.Add(new AdminPendingClaimItem(
                PlayerIdentityMapper.ToClaimDto(claim),
                claim.UserId,
                profile?.Email ?? string.Empty,
                string.IsNullOrWhiteSpace(fullName) ? null : fullName));
        }

        var pages = pageResult.Total == 0
            ? 0
            : (int)Math.Ceiling(pageResult.Total / (double)limit);

        return Result.Success(new ListAdminPlayerClaimsResult(
            items,
            new AdminPlayerClaimsPagination(page, limit, pageResult.Total, pages)));
    }
}
