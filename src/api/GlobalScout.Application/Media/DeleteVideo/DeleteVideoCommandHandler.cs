using GlobalScout.Application.Abstractions.Files;
using GlobalScout.Application.Abstractions.Media;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Media;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Media.DeleteVideo;

internal sealed class DeleteVideoCommandHandler(
    IMediaRepository media,
    IFileStorage fileStorage)
    : ICommandHandler<DeleteVideoCommand, DeleteVideoResult>
{
    public async Task<Result<DeleteVideoResult>> Handle(
        DeleteVideoCommand command,
        CancellationToken cancellationToken)
    {
        var item = await media.FindOwnedVideoAsync(command.UserId, command.VideoId, cancellationToken);
        if (item is null)
        {
            return Result.Failure<DeleteVideoResult>(MediaErrors.VideoNotFound);
        }

        var deleteFile = await fileStorage.DeleteAsync(item.StorageKey, cancellationToken);
        if (deleteFile.IsFailure)
        {
            return Result.Failure<DeleteVideoResult>(deleteFile.Error);
        }

        await media.DeleteAsync(command.VideoId, cancellationToken);

        return Result.Success(new DeleteVideoResult("Video deleted successfully"));
    }
}
