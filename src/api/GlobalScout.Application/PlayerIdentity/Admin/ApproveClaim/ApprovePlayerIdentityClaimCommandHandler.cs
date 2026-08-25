using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Statistics.RefreshMyStats;
using GlobalScout.Domain.PlayerIdentity;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.PlayerIdentity.Admin.ApproveClaim;

internal sealed class ApprovePlayerIdentityClaimCommandHandler(
    IPlayerIdentityClaimRepository claims,
    IUserDirectoryRepository users,
    IAuditLogRepository auditLogs,
    IPlayerStatisticsRefreshExecutor statsRefresh)
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

        if (claim.ExternalPlayerId is not null)
        {
            var taken = await users.PlayerIdExistsForAnotherUserAsync(
                claim.ExternalPlayerId.Value,
                claim.UserId,
                cancellationToken);
            if (taken)
            {
                return Result.Failure<PlayerIdentityClaimDto>(PlayerIdentityErrors.ExternalPlayerIdTaken);
            }
        }

        var now = DateTimeOffset.UtcNow;
        claim.Status = ClaimStatus.Verified;
        claim.ReviewedByUserId = command.AdminUserId;
        claim.ReviewedAt = now;
        claim.AdminNote = string.IsNullOrWhiteSpace(command.Note) ? null : command.Note.Trim();
        claim.UpdatedAt = now;

        if (claim.ExternalPlayerId is not null)
        {
            await users.SetPlayerIdAsync(claim.UserId, claim.ExternalPlayerId.Value, cancellationToken);
        }

        if (!string.IsNullOrWhiteSpace(claim.CandidateFirstName)
            || !string.IsNullOrWhiteSpace(claim.CandidateLastName))
        {
            await users.UpdateProfileFieldsAsync(
                claim.UserId,
                new ProfileFieldPatch
                {
                    FirstName = string.IsNullOrWhiteSpace(claim.CandidateFirstName)
                        ? null
                        : claim.CandidateFirstName.Trim(),
                    LastName = string.IsNullOrWhiteSpace(claim.CandidateLastName)
                        ? null
                        : claim.CandidateLastName.Trim(),
                },
                cancellationToken);
        }

        await claims.UpdateAsync(claim, cancellationToken);

        if (claim.ExternalPlayerId is not null)
        {
            // Best-effort: pull the player's profile + season stats now that the API player ID is linked,
            // so the verified dashboard has data immediately. Never fail approval if the provider is down.
            try
            {
                await statsRefresh.ExecuteAsync(claim.UserId, enforceCooldown: false, cancellationToken);
            }
            catch (Exception)
            {
                // Ignored: stats can be refreshed later via the manual refresh endpoint.
            }
        }

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
