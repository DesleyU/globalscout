using GlobalScout.Application.Abstractions.Files;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Domain.PlayerIdentity;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.PlayerIdentity.AddEvidence;

internal sealed class InitiateEvidenceUploadCommandHandler(
    IUserDirectoryRepository users,
    IPlayerIdentityClaimRepository claims,
    IFileKeyGenerator keyGenerator,
    IFileStorage fileStorage)
    : ICommandHandler<InitiateEvidenceUploadCommand, InitiateEvidenceUploadResult>
{
    public async Task<Result<InitiateEvidenceUploadResult>> Handle(
        InitiateEvidenceUploadCommand command,
        CancellationToken cancellationToken)
    {
        var access = await EvidenceUploadAccess.EnsureCanAddEvidenceAsync(users, claims, command.UserId, cancellationToken);
        if (access.IsFailure)
        {
            return Result.Failure<InitiateEvidenceUploadResult>(access.Error);
        }

        var storageKey = keyGenerator.CreateEvidenceKey(command.UserId, command.FileName);
        var upload = await fileStorage.CreateUploadUrlAsync(
            new FileUploadRequest(storageKey, command.ContentType, command.ContentLength),
            cancellationToken);

        return upload.IsFailure
            ? Result.Failure<InitiateEvidenceUploadResult>(upload.Error)
            : Result.Success(new InitiateEvidenceUploadResult(
                upload.Value.StorageKey,
                upload.Value.UploadUrl,
                upload.Value.HttpMethod,
                upload.Value.ExpiresAt));
    }
}

internal sealed class CompleteEvidenceUploadCommandHandler(
    IUserDirectoryRepository users,
    IPlayerIdentityClaimRepository claims,
    IFileKeyGenerator keyGenerator,
    IFileStorage fileStorage)
    : ICommandHandler<CompleteEvidenceUploadCommand, VerificationEvidenceDto>
{
    public async Task<Result<VerificationEvidenceDto>> Handle(
        CompleteEvidenceUploadCommand command,
        CancellationToken cancellationToken)
    {
        var access = await EvidenceUploadAccess.EnsureCanAddEvidenceAsync(users, claims, command.UserId, cancellationToken);
        if (access.IsFailure)
        {
            return Result.Failure<VerificationEvidenceDto>(access.Error);
        }

        var claim = access.Value;

        if (!keyGenerator.IsEvidenceKeyForUser(command.UserId, command.StorageKey))
        {
            return Result.Failure<VerificationEvidenceDto>(PlayerIdentityErrors.EvidenceStorageKeyForbidden);
        }

        var metadata = await fileStorage.GetMetadataAsync(command.StorageKey, cancellationToken);
        if (metadata.IsFailure)
        {
            return Result.Failure<VerificationEvidenceDto>(metadata.Error);
        }

        var now = DateTimeOffset.UtcNow;
        var evidence = new VerificationEvidence
        {
            Id = Guid.NewGuid(),
            ClaimId = claim.Id,
            Type = command.Type,
            StorageKey = command.StorageKey,
            Note = string.IsNullOrWhiteSpace(command.Note) ? null : command.Note.Trim(),
            CreatedAt = now
        };

        await claims.AddEvidenceAsync(evidence, cancellationToken);
        await EvidenceUploadAccess.TransitionToPendingVerificationIfNeededAsync(claims, claim, now, cancellationToken);

        return Result.Success(PlayerIdentityMapper.ToEvidenceDto(evidence));
    }
}

internal sealed class AddLinkEvidenceCommandHandler(
    IUserDirectoryRepository users,
    IPlayerIdentityClaimRepository claims)
    : ICommandHandler<AddLinkEvidenceCommand, VerificationEvidenceDto>
{
    public async Task<Result<VerificationEvidenceDto>> Handle(
        AddLinkEvidenceCommand command,
        CancellationToken cancellationToken)
    {
        var access = await EvidenceUploadAccess.EnsureCanAddEvidenceAsync(users, claims, command.UserId, cancellationToken);
        if (access.IsFailure)
        {
            return Result.Failure<VerificationEvidenceDto>(access.Error);
        }

        var claim = access.Value;
        var now = DateTimeOffset.UtcNow;
        var evidence = new VerificationEvidence
        {
            Id = Guid.NewGuid(),
            ClaimId = claim.Id,
            Type = command.Type,
            Url = command.Url.Trim(),
            Note = string.IsNullOrWhiteSpace(command.Note) ? null : command.Note.Trim(),
            CreatedAt = now
        };

        await claims.AddEvidenceAsync(evidence, cancellationToken);
        await EvidenceUploadAccess.TransitionToPendingVerificationIfNeededAsync(claims, claim, now, cancellationToken);

        return Result.Success(PlayerIdentityMapper.ToEvidenceDto(evidence));
    }
}

file static class EvidenceUploadAccess
{
    public static async Task<Result<PlayerIdentityClaim>> EnsureCanAddEvidenceAsync(
        IUserDirectoryRepository users,
        IPlayerIdentityClaimRepository claims,
        Guid userId,
        CancellationToken cancellationToken)
    {
        var access = await PlayerIdentityAccess.EnsurePlayerAsync(users, userId, cancellationToken);
        if (access.IsFailure)
        {
            return Result.Failure<PlayerIdentityClaim>(access.Error);
        }

        var claim = await claims.GetActiveByUserIdAsync(userId, cancellationToken);
        if (claim is null)
        {
            return Result.Failure<PlayerIdentityClaim>(PlayerIdentityErrors.ClaimNotFound);
        }

        if (!ClaimStatusRules.CanAddEvidence(claim.Status))
        {
            return Result.Failure<PlayerIdentityClaim>(PlayerIdentityErrors.InvalidStatusTransition);
        }

        return Result.Success(claim);
    }

    public static async Task TransitionToPendingVerificationIfNeededAsync(
        IPlayerIdentityClaimRepository claims,
        PlayerIdentityClaim claim,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        if (claim.Status != ClaimStatus.Claimed)
        {
            return;
        }

        claim.Status = ClaimStatus.PendingVerification;
        claim.UpdatedAt = now;
        await claims.UpdateAsync(claim, cancellationToken);
    }
}
