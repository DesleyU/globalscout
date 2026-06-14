using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Domain.PlayerIdentity;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.PlayerIdentity.Admin.ApproveClaim;

internal sealed class ApprovePlayerIdentityClaimCommandHandler(
    IPlayerIdentityClaimRepository claims,
    IUserDirectoryRepository users,
    IAuditLogRepository auditLogs)
    : ICommandHandler<ApprovePlayerIdentityClaimCommand, PlayerIdentityClaimDto>
{
    public async Task<Result<PlayerIdentityClaimDto>> Handle(
        ApprovePlayerIdentityClaimCommand command,
        CancellationToken cancellationToken)
    {
        var claim = await claims.GetByIdWithEvidenceAsync(command.ClaimId, cancellationToken);
        if (claim is null)
        {
            return Result.Failure<PlayerIdentityClaimDto>(PlayerIdentityErrors.ClaimNotFound);
        }

        if (!ClaimStatusRules.CanReview(claim.Status))
        {
            return Result.Failure<PlayerIdentityClaimDto>(PlayerIdentityErrors.InvalidStatusTransition);
        }

        if (claim.Evidence.Count == 0)
        {
            return Result.Failure<PlayerIdentityClaimDto>(PlayerIdentityErrors.EvidenceRequiresFileOrUrl);
        }

        var taken = await users.PlayerIdExistsForAnotherUserAsync(claim.ExternalPlayerId, claim.UserId, cancellationToken);
        if (taken)
        {
            return Result.Failure<PlayerIdentityClaimDto>(PlayerIdentityErrors.ExternalPlayerIdTaken);
        }

        var now = DateTimeOffset.UtcNow;
        claim.Status = ClaimStatus.Verified;
        claim.ReviewedByUserId = command.AdminUserId;
        claim.ReviewedAt = now;
        claim.AdminNote = string.IsNullOrWhiteSpace(command.Note) ? null : command.Note.Trim();
        claim.UpdatedAt = now;

        await users.SetPlayerIdAsync(claim.UserId, claim.ExternalPlayerId, cancellationToken);
        await claims.UpdateAsync(claim, cancellationToken);
        await auditLogs.AddAsync(
            new AuditLogEntry(
                command.AdminUserId,
                "player_identity.claim.approved",
                nameof(PlayerIdentityClaim),
                claim.Id.ToString(),
                new Dictionary<string, object?>
                {
                    ["userId"] = claim.UserId,
                    ["externalPlayerId"] = claim.ExternalPlayerId,
                    ["provider"] = claim.ExternalProvider,
                    ["confidenceScore"] = claim.ConfidenceScore
                }),
            cancellationToken);

        return Result.Success(PlayerIdentityMapper.ToClaimDto(claim));
    }
}
