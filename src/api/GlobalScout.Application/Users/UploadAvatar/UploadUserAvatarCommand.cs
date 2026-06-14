using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Users;

namespace GlobalScout.Application.Users.UploadAvatar;

public sealed class UploadUserAvatarCommand : ICommand<UploadUserAvatarResult>
{
    public Guid UserId { get; init; }

    public Stream? FileStream { get; init; }

    public string FileName { get; init; } = string.Empty;

    public string ContentType { get; init; } = string.Empty;
}

public sealed class InitiateAvatarUploadCommand : ICommand<InitiateAvatarUploadResult>
{
    public Guid UserId { get; init; }

    public string FileName { get; init; } = string.Empty;

    public string ContentType { get; init; } = string.Empty;

    public long ContentLength { get; init; }
}

public sealed class CompleteAvatarUploadCommand : ICommand<CompleteAvatarUploadResult>
{
    public Guid UserId { get; init; }

    public string StorageKey { get; init; } = string.Empty;
}
