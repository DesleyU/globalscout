using GlobalScout.Application.Abstractions.Messaging;

namespace GlobalScout.Application.Media.UploadVideo;

public sealed class UploadVideoCommand : ICommand<UploadVideoResult>
{
    public Guid UserId { get; init; }

    public Stream? FileStream { get; init; }

    public string FileName { get; init; } = string.Empty;

    public string ContentType { get; init; } = string.Empty;

    public string? Title { get; init; }

    public string? Description { get; init; }

    public string? Tags { get; init; }
}

public sealed class InitiateVideoUploadCommand : ICommand<InitiateVideoUploadResult>
{
    public Guid UserId { get; init; }

    public string FileName { get; init; } = string.Empty;

    public string ContentType { get; init; } = string.Empty;

    public long ContentLength { get; init; }
}

public sealed class CompleteVideoUploadCommand : ICommand<CompleteVideoUploadResult>
{
    public Guid UserId { get; init; }

    public string StorageKey { get; init; } = string.Empty;

    public string FileName { get; init; } = string.Empty;

    public string ContentType { get; init; } = string.Empty;

    public string? Title { get; init; }

    public string? Description { get; init; }

    public string? Tags { get; init; }
}
