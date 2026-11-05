using GlobalScout.Application.Abstractions.Messaging;

namespace GlobalScout.Application.Media.UploadPhoto;

public sealed class InitiatePhotoUploadCommand : ICommand<InitiatePhotoUploadResult>
{
    public Guid UserId { get; init; }

    public string FileName { get; init; } = string.Empty;

    public string ContentType { get; init; } = string.Empty;

    public long ContentLength { get; init; }
}

public sealed class CompletePhotoUploadCommand : ICommand<CompletePhotoUploadResult>
{
    public Guid UserId { get; init; }

    public string StorageKey { get; init; } = string.Empty;

    public string FileName { get; init; } = string.Empty;

    public string ContentType { get; init; } = string.Empty;

    public string? Title { get; init; }

    public string? Description { get; init; }

    public string? Tags { get; init; }
}
