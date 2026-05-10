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

namespace GlobalScout.Application.Media.UploadVideo;

internal sealed class InitiateVideoUploadCommandHandler(
    IUserDirectoryRepository users,
    IMediaRepository media,
    IFileKeyGenerator keyGenerator,
    IFileStorage fileStorage)
    : ICommandHandler<InitiateVideoUploadCommand, InitiateVideoUploadResult>
{
    public async Task<Result<InitiateVideoUploadResult>> Handle(
        InitiateVideoUploadCommand command,
        CancellationToken cancellationToken)
    {
        var access = await VideoUploadAccess.EnsureCanUploadVideoAsync(users, media, command.UserId, cancellationToken);
        if (access.IsFailure)
        {
            return Result.Failure<InitiateVideoUploadResult>(access.Error);
        }

        var storageKey = keyGenerator.CreateVideoKey(command.UserId, command.FileName);
        var upload = await fileStorage.CreateUploadUrlAsync(
            new FileUploadRequest(storageKey, command.ContentType, command.ContentLength),
            cancellationToken);

        return upload.IsFailure
            ? Result.Failure<InitiateVideoUploadResult>(upload.Error)
            : Result.Success(new InitiateVideoUploadResult(
                upload.Value.StorageKey,
                upload.Value.UploadUrl,
                upload.Value.HttpMethod,
                upload.Value.ExpiresAt));
    }
}

internal sealed class CompleteVideoUploadCommandHandler(
    IUserDirectoryRepository users,
    IMediaRepository media,
    IFileKeyGenerator keyGenerator,
    IFileStorage fileStorage)
    : ICommandHandler<CompleteVideoUploadCommand, CompleteVideoUploadResult>
{
    public async Task<Result<CompleteVideoUploadResult>> Handle(
        CompleteVideoUploadCommand command,
        CancellationToken cancellationToken)
    {
        var access = await VideoUploadAccess.EnsureCanUploadVideoAsync(users, media, command.UserId, cancellationToken);
        if (access.IsFailure)
        {
            return Result.Failure<CompleteVideoUploadResult>(access.Error);
        }

        if (!keyGenerator.IsVideoKeyForUser(command.UserId, command.StorageKey))
        {
            return Result.Failure<CompleteVideoUploadResult>(
                Error.Forbidden("Media.StorageKeyForbidden", "The uploaded video does not belong to the current user."));
        }

        var metadata = await fileStorage.GetMetadataAsync(command.StorageKey, cancellationToken);
        if (metadata.IsFailure)
        {
            return Result.Failure<CompleteVideoUploadResult>(metadata.Error);
        }

        var now = DateTimeOffset.UtcNow;
        string title = string.IsNullOrWhiteSpace(command.Title) ? "Player Video" : command.Title.Trim();
        string description = command.Description?.Trim() ?? string.Empty;
        string tags = command.Tags?.Trim() ?? string.Empty;

        var entity = new MediaItem
        {
            Id = Guid.NewGuid(),
            UserId = command.UserId,
            Type = MediaType.Video,
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

        return Result.Success(new CompleteVideoUploadResult(
            entity.Id,
            entity.StorageKey,
            title,
            description,
            tags,
            entity.CreatedAt));
    }
}

file static class VideoUploadAccess
{
    public static async Task<Result> EnsureCanUploadVideoAsync(
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
            int count = await media.CountVideosAsync(userId, cancellationToken);
            if (count >= SubscriptionLimits.BasicMaxVideos)
            {
                return Result.Failure(MediaErrors.VideoLimitReached(count, SubscriptionLimits.BasicMaxVideos));
            }
        }

        return Result.Success();
    }
}
