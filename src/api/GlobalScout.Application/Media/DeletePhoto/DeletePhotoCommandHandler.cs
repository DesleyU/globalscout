using GlobalScout.Application.Abstractions.Files;
using GlobalScout.Application.Abstractions.Media;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Media;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Media.DeletePhoto;

internal sealed class DeletePhotoCommandHandler(
    IMediaRepository media,
    IFileStorage fileStorage)
    : ICommandHandler<DeletePhotoCommand, DeletePhotoResult>
{
    public async Task<Result<DeletePhotoResult>> Handle(
        DeletePhotoCommand command,
        CancellationToken cancellationToken)
    {
        var item = await media.FindOwnedImageAsync(command.UserId, command.PhotoId, cancellationToken);
        if (item is null)
        {
            return Result.Failure<DeletePhotoResult>(MediaErrors.PhotoNotFound);
        }

        var deleteFile = await fileStorage.DeleteAsync(item.StorageKey, cancellationToken);
        if (deleteFile.IsFailure)
        {
            return Result.Failure<DeletePhotoResult>(deleteFile.Error);
        }

        await media.DeleteAsync(command.PhotoId, cancellationToken);

        return Result.Success(new DeletePhotoResult("Photo deleted successfully"));
    }
}
