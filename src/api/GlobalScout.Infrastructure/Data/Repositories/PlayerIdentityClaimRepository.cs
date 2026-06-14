using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Domain.PlayerIdentity;
using GlobalScout.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace GlobalScout.Infrastructure.Data.Repositories;

internal sealed class PlayerIdentityClaimRepository(GlobalScoutDbContext db) : IPlayerIdentityClaimRepository
{
    private static readonly ClaimStatus[] ActiveStatuses =
    [
        ClaimStatus.Claimed,
        ClaimStatus.PendingVerification,
        ClaimStatus.Verified
    ];

    public async Task AddAsync(PlayerIdentityClaim claim, CancellationToken cancellationToken)
    {
        db.PlayerIdentityClaims.Add(claim);
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task AddEvidenceAsync(VerificationEvidence evidence, CancellationToken cancellationToken)
    {
        db.VerificationEvidence.Add(evidence);
        await db.SaveChangesAsync(cancellationToken);
    }

    public Task<VerificationEvidence?> GetEvidenceAsync(
        Guid claimId,
        Guid evidenceId,
        CancellationToken cancellationToken) =>
        db.VerificationEvidence.AsNoTracking()
            .FirstOrDefaultAsync(
                e => e.ClaimId == claimId && e.Id == evidenceId,
                cancellationToken);

    public Task<PlayerIdentityClaim?> GetByIdAsync(Guid claimId, CancellationToken cancellationToken) =>
        db.PlayerIdentityClaims.AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == claimId, cancellationToken);

    public Task<PlayerIdentityClaim?> GetByIdWithEvidenceAsync(Guid claimId, CancellationToken cancellationToken) =>
        db.PlayerIdentityClaims.AsNoTracking()
            .Include(c => c.Evidence)
            .FirstOrDefaultAsync(c => c.Id == claimId, cancellationToken);

    public Task<PlayerIdentityClaim?> GetActiveByUserIdAsync(Guid userId, CancellationToken cancellationToken) =>
        db.PlayerIdentityClaims.AsNoTracking()
            .Include(c => c.Evidence)
            .Where(c => c.UserId == userId && ActiveStatuses.Contains(c.Status))
            .OrderByDescending(c => c.UpdatedAt)
            .FirstOrDefaultAsync(cancellationToken);

    public Task<PlayerIdentityClaim?> GetLatestByUserIdAsync(Guid userId, CancellationToken cancellationToken) =>
        db.PlayerIdentityClaims.AsNoTracking()
            .Include(c => c.Evidence)
            .Where(c => c.UserId == userId)
            .OrderByDescending(c => c.UpdatedAt)
            .FirstOrDefaultAsync(cancellationToken);

    public async Task<IReadOnlyList<PlayerIdentityClaim>> ListPendingVerificationAsync(
        CancellationToken cancellationToken)
    {
        return await db.PlayerIdentityClaims.AsNoTracking()
            .Include(c => c.Evidence)
            .Where(c => c.Status == ClaimStatus.PendingVerification)
            .OrderByDescending(c => c.UpdatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<AdminPlayerClaimsListPage> ListForAdminAsync(
        AdminPlayerClaimsListCriteria criteria,
        CancellationToken cancellationToken)
    {
        IQueryable<PlayerIdentityClaim> query = db.PlayerIdentityClaims.AsNoTracking()
            .Include(c => c.Evidence);

        if (criteria.Status is not null)
        {
            query = query.Where(c => c.Status == criteria.Status.Value);
        }

        if (!string.IsNullOrWhiteSpace(criteria.Search))
        {
            var term = criteria.Search.Trim();
            query = query.Where(c =>
                EF.Functions.ILike(c.CandidateName, $"%{term}%")
                || EF.Functions.ILike(c.FullName, $"%{term}%")
                || db.Users.Any(u =>
                    u.Id == c.UserId
                    && u.Email != null
                    && EF.Functions.ILike(u.Email, $"%{term}%"))
                || db.Profiles.Any(p =>
                    p.UserId == c.UserId
                    && (EF.Functions.ILike(p.FirstName, $"%{term}%")
                        || EF.Functions.ILike(p.LastName, $"%{term}%"))));
        }

        var total = await query.CountAsync(cancellationToken);
        var skip = (criteria.Page - 1) * criteria.Limit;
        var claims = await query
            .OrderByDescending(c => c.UpdatedAt)
            .Skip(skip)
            .Take(criteria.Limit)
            .ToListAsync(cancellationToken);

        return new AdminPlayerClaimsListPage(claims, total);
    }

    public async Task UpdateAsync(PlayerIdentityClaim claim, CancellationToken cancellationToken)
    {
        await db.PlayerIdentityClaims
            .Where(c => c.Id == claim.Id)
            .ExecuteUpdateAsync(
                setters => setters
                    .SetProperty(c => c.Status, claim.Status)
                    .SetProperty(c => c.UpdatedAt, claim.UpdatedAt)
                    .SetProperty(c => c.AdminNote, claim.AdminNote)
                    .SetProperty(c => c.ReviewedByUserId, claim.ReviewedByUserId)
                    .SetProperty(c => c.ReviewedAt, claim.ReviewedAt),
                cancellationToken);
    }
}
