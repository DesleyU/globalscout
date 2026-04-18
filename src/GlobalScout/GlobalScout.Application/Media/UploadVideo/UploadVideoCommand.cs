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
