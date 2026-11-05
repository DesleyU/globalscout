using GlobalScout.Application.Abstractions.Files;
using GlobalScout.Application.Abstractions.Media;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Subscriptions;
using GlobalScout.Application.Users;
using GlobalScout.Domain.Identity;
using GlobalScout.Domain.Media;
using GlobalScout.Domain.Users;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Media.UploadPhoto;

internal sealed class InitiatePhotoUploadCommandHandler(
    IUserDirectoryRepository users,
    IMediaRepository media,
    IFileKeyGenerator keyGenerator,
    IFileStorage fileStorage)
    : ICommandHandler<InitiatePhotoUploadCommand, InitiatePhotoUploadResult>
{
    public async Task<Result<InitiatePhotoUploadResult>> Handle(
        InitiatePhotoUploadCommand command,
        CancellationToken cancellationToken)
    {
        var access = await PhotoUploadAccess.EnsureCanUploadPhotoAsync(users, media, command.UserId, cancellationToken);
        if (access.IsFailure)
        {
            return Result.Failure<InitiatePhotoUploadResult>(access.Error);
        }

        var storageKey = keyGenerator.CreatePhotoKey(command.UserId, command.FileName);
        var upload = await fileStorage.CreateUploadUrlAsync(
            new FileUploadRequest(storageKey, command.ContentType, command.ContentLength),
            cancellationToken);

        return upload.IsFailure
            ? Result.Failure<InitiatePhotoUploadResult>(upload.Error)
            : Result.Success(new InitiatePhotoUploadResult(
                upload.Value.StorageKey,
                upload.Value.UploadUrl,
                upload.Value.HttpMethod,
                upload.Value.ExpiresAt));
    }
}

internal sealed class CompletePhotoUploadCommandHandler(
    IUserDirectoryRepository users,
    IMediaRepository media,
    IFileKeyGenerator keyGenerator,
    IFileStorage fileStorage)
    : ICommandHandler<CompletePhotoUploadCommand, CompletePhotoUploadResult>
{
    public async Task<Result<CompletePhotoUploadResult>> Handle(
        CompletePhotoUploadCommand command,
        CancellationToken cancellationToken)
    {
        var access = await PhotoUploadAccess.EnsureCanUploadPhotoAsync(users, media, command.UserId, cancellationToken);
        if (access.IsFailure)
        {
            return Result.Failure<CompletePhotoUploadResult>(access.Error);
        }

        if (!keyGenerator.IsPhotoKeyForUser(command.UserId, command.StorageKey))
        {
            return Result.Failure<CompletePhotoUploadResult>(
                Error.Forbidden("Media.StorageKeyForbidden", "The uploaded photo does not belong to the current user."));
        }

        var metadata = await fileStorage.GetMetadataAsync(command.StorageKey, cancellationToken);
        if (metadata.IsFailure)
        {
            return Result.Failure<CompletePhotoUploadResult>(metadata.Error);
        }

        var now = DateTimeOffset.UtcNow;
        string title = string.IsNullOrWhiteSpace(command.Title) ? "Player Photo" : command.Title.Trim();
        string description = command.Description?.Trim() ?? string.Empty;
        string tags = command.Tags?.Trim() ?? string.Empty;

        var entity = new MediaItem
        {
            Id = Guid.NewGuid(),
            UserId = command.UserId,
            Type = MediaType.Image,
            StorageKey = command.StorageKey,
            Filename = Path.GetFileName(command.StorageKey),
            OriginalName = command.FileName,
            MimeType = string.IsNullOrWhiteSpace(command.ContentType)
                ? metadata.Value.ContentType
                : command.ContentType,
            Size = (int)Math.Min(metadata.Value.ContentLength, int.MaxValue),
            Title = title,
            Description = description,
            Tags = tags,
            CreatedAt = now,
            UpdatedAt = now
        };

        await media.AddAsync(entity, cancellationToken);

        return Result.Success(new CompletePhotoUploadResult(
            entity.Id,
            entity.StorageKey,
            title,
            description,
            tags,
            entity.CreatedAt));
    }
}

file static class PhotoUploadAccess
{
    public static async Task<Result> EnsureCanUploadPhotoAsync(
        IUserDirectoryRepository users,
        IMediaRepository media,
        Guid userId,
        CancellationToken cancellationToken)
    {
        var ctx = await users.GetMediaUploadContextAsync(userId, cancellationToken);
        if (ctx is null)
        {
            return Result.Failure(UsersErrors.UserNotFound);
        }

        if (ctx.Role != UserRole.Player)
        {
            return Result.Failure(MediaErrors.OnlyPlayersCanUpload);
        }

        if (ctx.AccountType == AccountType.Basic)
        {
            int count = await media.CountImagesAsync(userId, cancellationToken);
            if (count >= SubscriptionLimits.BasicMaxPhotos)
            {
                return Result.Failure(MediaErrors.PhotoLimitReached(count, SubscriptionLimits.BasicMaxPhotos));
            }
        }

        return Result.Success();
    }
}
