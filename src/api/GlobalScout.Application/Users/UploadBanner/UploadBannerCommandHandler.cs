using GlobalScout.Application.Abstractions.Files;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Users;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Users.UploadBanner;

internal sealed class InitiateBannerUploadCommandHandler(
    IFileKeyGenerator keyGenerator,
    IFileStorage fileStorage) : ICommandHandler<InitiateBannerUploadCommand, InitiateBannerUploadResult>
{
    public async Task<Result<InitiateBannerUploadResult>> Handle(
        InitiateBannerUploadCommand command,
        CancellationToken cancellationToken)
    {
        var storageKey = keyGenerator.CreateBannerKey(command.UserId, command.FileName);
        var upload = await fileStorage.CreateUploadUrlAsync(
            new FileUploadRequest(storageKey, command.ContentType, command.ContentLength),
            cancellationToken);

        return upload.IsFailure
            ? Result.Failure<InitiateBannerUploadResult>(upload.Error)
            : Result.Success(new InitiateBannerUploadResult(
                upload.Value.StorageKey,
                upload.Value.UploadUrl,
                upload.Value.HttpMethod,
                upload.Value.ExpiresAt));
    }
}

internal sealed class CompleteBannerUploadCommandHandler(
    IUserDirectoryRepository users,
    IFileKeyGenerator keyGenerator,
    IFileStorage fileStorage) : ICommandHandler<CompleteBannerUploadCommand, CompleteBannerUploadResult>
{
    public async Task<Result<CompleteBannerUploadResult>> Handle(
        CompleteBannerUploadCommand command,
        CancellationToken cancellationToken)
    {
        if (!keyGenerator.IsBannerKeyForUser(command.UserId, command.StorageKey))
        {
            return Result.Failure<CompleteBannerUploadResult>(
                Error.Forbidden("Banner.StorageKeyForbidden", "The uploaded banner does not belong to the current user."));
        }

        var metadata = await fileStorage.GetMetadataAsync(command.StorageKey, cancellationToken);
        if (metadata.IsFailure)
        {
            return Result.Failure<CompleteBannerUploadResult>(metadata.Error);
        }

        await users.SetBannerStorageKeyAsync(command.UserId, command.StorageKey, cancellationToken);

        var full = await users.GetFullProfileAsync(command.UserId, cancellationToken);
        if (full?.Profile is null)
        {
            return Result.Failure<CompleteBannerUploadResult>(UsersErrors.UserNotFound);
        }

        return Result.Success(new CompleteBannerUploadResult(
            "Banner uploaded successfully",
            command.StorageKey,
            full.Profile));
    }
}
