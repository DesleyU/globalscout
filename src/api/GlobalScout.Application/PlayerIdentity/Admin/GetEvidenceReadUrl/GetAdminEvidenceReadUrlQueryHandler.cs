using GlobalScout.Application.Abstractions.Files;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.PlayerIdentity;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.PlayerIdentity.Admin.GetEvidenceReadUrl;

internal sealed class GetAdminEvidenceReadUrlQueryHandler(
    IPlayerIdentityClaimRepository claims,
    IFileStorage fileStorage)
    : IQueryHandler<GetAdminEvidenceReadUrlQuery, EvidenceReadUrlResult>
{
    public async Task<Result<EvidenceReadUrlResult>> Handle(
        GetAdminEvidenceReadUrlQuery query,
        CancellationToken cancellationToken)
    {
        var evidence = await claims.GetEvidenceAsync(query.ClaimId, query.EvidenceId, cancellationToken);
        if (evidence is null)
        {
            return Result.Failure<EvidenceReadUrlResult>(PlayerIdentityErrors.EvidenceNotFound);
        }

        if (string.IsNullOrWhiteSpace(evidence.StorageKey))
        {
            return Result.Failure<EvidenceReadUrlResult>(PlayerIdentityErrors.EvidenceRequiresFileOrUrl);
        }

        var readUrl = await fileStorage.CreateReadUrlAsync(evidence.StorageKey, cancellationToken);
        return readUrl.IsFailure
            ? Result.Failure<EvidenceReadUrlResult>(readUrl.Error)
            : Result.Success(new EvidenceReadUrlResult(readUrl.Value.Url, readUrl.Value.ExpiresAt));
    }
}
