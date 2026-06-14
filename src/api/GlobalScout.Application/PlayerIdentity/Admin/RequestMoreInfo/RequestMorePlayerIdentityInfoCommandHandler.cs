using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Domain.PlayerIdentity;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.PlayerIdentity.Admin.RequestMoreInfo;

internal sealed class RequestMorePlayerIdentityInfoCommandHandler(
    IPlayerIdentityClaimRepository claims,
    IAuditLogRepository auditLogs)
    : ICommandHandler<RequestMorePlayerIdentityInfoCommand, PlayerIdentityClaimDto>
{
    public async Task<Result<PlayerIdentityClaimDto>> Handle(
        RequestMorePlayerIdentityInfoCommand command,
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

        var now = DateTimeOffset.UtcNow;
        claim.AdminNote = command.Note.Trim();
        claim.ReviewedByUserId = command.AdminUserId;
        claim.ReviewedAt = now;
        claim.UpdatedAt = now;

        await claims.UpdateAsync(claim, cancellationToken);
        await auditLogs.AddAsync(
            new AuditLogEntry(
                command.AdminUserId,
                "player_identity.claim.request_more_info",
                nameof(PlayerIdentityClaim),
                claim.Id.ToString(),
                new Dictionary<string, object?>
                {
                    ["userId"] = claim.UserId,
                    ["note"] = claim.AdminNote
                }),
            cancellationToken);

        return Result.Success(PlayerIdentityMapper.ToClaimDto(claim));
    }
}
