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

internal sealed class UploadVideoCommandHandler(
    IUserDirectoryRepository users,
    IMediaRepository media,
    IVideoStorage videoStorage)
    : ICommandHandler<UploadVideoCommand, UploadVideoResult>
{
    public async Task<Result<UploadVideoResult>> Handle(
        UploadVideoCommand command,
        CancellationToken cancellationToken)
    {
        await using var stream = command.FileStream!;
        long? byteLength = stream.CanSeek ? stream.Length : null;

        var ctx = await users.GetMediaUploadContextAsync(command.UserId, cancellationToken);
        if (ctx is null)
        {
            return Result.Failure<UploadVideoResult>(UsersErrors.UserNotFound);
        }

        if (ctx.Role != UserRole.Player)
        {
            return Result.Failure<UploadVideoResult>(MediaErrors.OnlyPlayersCanUpload);
        }

        if (ctx.AccountType == AccountType.Basic)
        {
            int count = await media.CountVideosAsync(command.UserId, cancellationToken);
            if (count >= SubscriptionLimits.BasicMaxVideos)
            {
                return Result.Failure<UploadVideoResult>(
                    MediaErrors.VideoLimitReached(count, SubscriptionLimits.BasicMaxVideos));
            }
        }

        var saved = await videoStorage.SaveAsync(stream, command.FileName, cancellationToken);
        if (saved.IsFailure)
        {
            return Result.Failure<UploadVideoResult>(saved.Error);
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
            Url = saved.Value,
            Filename = Path.GetFileName(saved.Value),
            OriginalName = command.FileName,
            MimeType = string.IsNullOrWhiteSpace(command.ContentType) ? null : command.ContentType,
            Size = byteLength is null ? null : (int)Math.Min(byteLength.Value, int.MaxValue),
            Title = title,
            Description = description,
            Tags = tags,
            CreatedAt = now,
            UpdatedAt = now
        };

        await media.AddAsync(entity, cancellationToken);

        return Result.Success(new UploadVideoResult(
            entity.Id,
            entity.Url,
            title,
            description,
            tags,
            entity.CreatedAt));
    }
}
