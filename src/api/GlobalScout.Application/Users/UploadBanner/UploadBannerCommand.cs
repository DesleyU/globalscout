using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Users;

namespace GlobalScout.Application.Users.UploadBanner;

public sealed class InitiateBannerUploadCommand : ICommand<InitiateBannerUploadResult>
{
    public Guid UserId { get; init; }

    public string FileName { get; init; } = string.Empty;

    public string ContentType { get; init; } = string.Empty;

    public long ContentLength { get; init; }
}

public sealed class CompleteBannerUploadCommand : ICommand<CompleteBannerUploadResult>
{
    public Guid UserId { get; init; }

    public string StorageKey { get; init; } = string.Empty;
}
