using GlobalScout.Application.Abstractions.Files;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Users;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Users.UploadAvatar;

internal sealed class InitiateAvatarUploadCommandHandler(
    IFileKeyGenerator keyGenerator,
    IFileStorage fileStorage) : ICommandHandler<InitiateAvatarUploadCommand, InitiateAvatarUploadResult>
{
    public async Task<Result<InitiateAvatarUploadResult>> Handle(
        InitiateAvatarUploadCommand command,
        CancellationToken cancellationToken)
    {
        var storageKey = keyGenerator.CreateAvatarKey(command.UserId, command.FileName);
        var upload = await fileStorage.CreateUploadUrlAsync(
            new FileUploadRequest(storageKey, command.ContentType, command.ContentLength),
            cancellationToken);

        return upload.IsFailure
            ? Result.Failure<InitiateAvatarUploadResult>(upload.Error)
            : Result.Success(new InitiateAvatarUploadResult(
                upload.Value.StorageKey,
                upload.Value.UploadUrl,
                upload.Value.HttpMethod,
                upload.Value.ExpiresAt));
    }
}

internal sealed class CompleteAvatarUploadCommandHandler(
    IUserDirectoryRepository users,
    IFileKeyGenerator keyGenerator,
    IFileStorage fileStorage) : ICommandHandler<CompleteAvatarUploadCommand, CompleteAvatarUploadResult>
{
    public async Task<Result<CompleteAvatarUploadResult>> Handle(
        CompleteAvatarUploadCommand command,
        CancellationToken cancellationToken)
    {
        if (!keyGenerator.IsAvatarKeyForUser(command.UserId, command.StorageKey))
        {
            return Result.Failure<CompleteAvatarUploadResult>(
                Error.Forbidden("Avatar.StorageKeyForbidden", "The uploaded avatar does not belong to the current user."));
        }

        var metadata = await fileStorage.GetMetadataAsync(command.StorageKey, cancellationToken);
        if (metadata.IsFailure)
        {
            return Result.Failure<CompleteAvatarUploadResult>(metadata.Error);
        }

        await users.SetAvatarStorageKeyAsync(command.UserId, command.StorageKey, cancellationToken);

        var full = await users.GetFullProfileAsync(command.UserId, cancellationToken);
        if (full?.Profile is null)
        {
            return Result.Failure<CompleteAvatarUploadResult>(UsersErrors.UserNotFound);
        }

        return Result.Success(new CompleteAvatarUploadResult(
            "Avatar uploaded successfully",
            command.StorageKey,
            full.Profile));
    }
}
