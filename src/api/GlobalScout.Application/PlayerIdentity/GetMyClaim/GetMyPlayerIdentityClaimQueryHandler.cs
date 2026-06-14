using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Domain.PlayerIdentity;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.PlayerIdentity.GetMyClaim;

internal sealed class GetMyPlayerIdentityClaimQueryHandler(
    IUserDirectoryRepository users,
    IPlayerIdentityClaimRepository claims)
    : IQueryHandler<GetMyPlayerIdentityClaimQuery, GetMyPlayerIdentityClaimResult>
{
    public async Task<Result<GetMyPlayerIdentityClaimResult>> Handle(
        GetMyPlayerIdentityClaimQuery query,
        CancellationToken cancellationToken)
    {
        var access = await PlayerIdentityAccess.EnsurePlayerAsync(users, query.UserId, cancellationToken);
        if (access.IsFailure)
        {
            return Result.Failure<GetMyPlayerIdentityClaimResult>(access.Error);
        }

        var claim = await claims.GetLatestByUserIdAsync(query.UserId, cancellationToken);
        if (claim is null)
        {
            return Result.Success(new GetMyPlayerIdentityClaimResult(
                ClaimStatus.Unmatched.ToString(),
                null));
        }

        var claimWithEvidence = await claims.GetByIdWithEvidenceAsync(claim.Id, cancellationToken) ?? claim;

        return Result.Success(new GetMyPlayerIdentityClaimResult(
            claimWithEvidence.Status.ToString(),
            PlayerIdentityMapper.ToClaimDto(claimWithEvidence)));
    }
}
