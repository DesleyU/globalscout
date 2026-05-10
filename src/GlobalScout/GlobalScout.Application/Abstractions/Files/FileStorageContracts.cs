using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Abstractions.Files;

public sealed record FileUploadUrl(
    string StorageKey,
    string UploadUrl,
    string HttpMethod,
    DateTimeOffset ExpiresAt);

public sealed record FileReadUrl(string Url, DateTimeOffset ExpiresAt);

public sealed record FileObjectMetadata(long ContentLength, string? ContentType);

public sealed record FileUploadRequest(
    string StorageKey,
    string ContentType,
    long ContentLength);

public interface IFileKeyGenerator
{
    string CreateAvatarKey(Guid userId, string originalFileName);

    string CreateVideoKey(Guid userId, string originalFileName);

    bool IsAvatarKeyForUser(Guid userId, string storageKey);

    bool IsVideoKeyForUser(Guid userId, string storageKey);
}

public interface IFileStorage
{
    Task<Result<FileUploadUrl>> CreateUploadUrlAsync(
        FileUploadRequest request,
        CancellationToken cancellationToken);

    Task<Result<FileReadUrl>> CreateReadUrlAsync(
        string storageKey,
        CancellationToken cancellationToken);

    Task<Result<FileObjectMetadata>> GetMetadataAsync(
        string storageKey,
        CancellationToken cancellationToken);

    Task<Result> DeleteAsync(string storageKey, CancellationToken cancellationToken);
}

public interface IFileStorageInitializer
{
    Task EnsureReadyAsync(CancellationToken cancellationToken);
}

public interface IAvatarUrlResolver
{
    Task<string?> ResolveAsync(string? storageKey, CancellationToken cancellationToken);
}
