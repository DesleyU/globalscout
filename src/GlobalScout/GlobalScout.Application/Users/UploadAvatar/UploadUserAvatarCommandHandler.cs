using GlobalScout.Application.Abstractions.Files;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Users;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Users.UploadAvatar;

internal sealed class UploadUserAvatarCommandHandler(
    IUserDirectoryRepository users,
    IAvatarStorage avatarStorage) : ICommandHandler<UploadUserAvatarCommand, UploadUserAvatarResult>
{
    public async Task<Result<UploadUserAvatarResult>> Handle(
        UploadUserAvatarCommand command,
        CancellationToken cancellationToken)
    {
        await using var stream = command.FileStream!;

        var saved = await avatarStorage.SaveAsync(stream, command.FileName, cancellationToken);
        if (saved.IsFailure)
        {
            return Result.Failure<UploadUserAvatarResult>(saved.Error);
        }

        await users.SetAvatarAsync(command.UserId, saved.Value, cancellationToken);

        var full = await users.GetFullProfileAsync(command.UserId, cancellationToken);
        if (full?.Profile is null)
        {
            return Result.Failure<UploadUserAvatarResult>(UsersErrors.UserNotFound);
        }

        return Result.Success(new UploadUserAvatarResult(
            "Avatar uploaded successfully",
            saved.Value,
            full.Profile));
    }
}
