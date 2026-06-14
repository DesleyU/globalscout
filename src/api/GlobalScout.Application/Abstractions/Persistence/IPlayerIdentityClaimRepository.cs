using GlobalScout.Domain.PlayerIdentity;

namespace GlobalScout.Application.Abstractions.Persistence;

public interface IPlayerIdentityClaimRepository
{
    Task AddAsync(PlayerIdentityClaim claim, CancellationToken cancellationToken);

    Task AddEvidenceAsync(VerificationEvidence evidence, CancellationToken cancellationToken);

    Task<VerificationEvidence?> GetEvidenceAsync(
        Guid claimId,
        Guid evidenceId,
        CancellationToken cancellationToken);

    Task<PlayerIdentityClaim?> GetByIdAsync(Guid claimId, CancellationToken cancellationToken);

    Task<PlayerIdentityClaim?> GetByIdWithEvidenceAsync(Guid claimId, CancellationToken cancellationToken);

    Task<PlayerIdentityClaim?> GetActiveByUserIdAsync(Guid userId, CancellationToken cancellationToken);

    Task<PlayerIdentityClaim?> GetLatestByUserIdAsync(Guid userId, CancellationToken cancellationToken);

    Task<IReadOnlyList<PlayerIdentityClaim>> ListPendingVerificationAsync(CancellationToken cancellationToken);

    Task<AdminPlayerClaimsListPage> ListForAdminAsync(
        AdminPlayerClaimsListCriteria criteria,
        CancellationToken cancellationToken);

    Task UpdateAsync(PlayerIdentityClaim claim, CancellationToken cancellationToken);
}
