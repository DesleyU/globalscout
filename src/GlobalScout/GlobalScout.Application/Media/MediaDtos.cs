namespace GlobalScout.Application.Media;

public sealed record UploadVideoResult(
    Guid Id,
    string Url,
    string Title,
    string Description,
    string Tags,
    DateTimeOffset CreatedAt);

public sealed record InitiateVideoUploadResult(
    string StorageKey,
    string UploadUrl,
    string HttpMethod,
    DateTimeOffset ExpiresAt);

public sealed record CompleteVideoUploadResult(
    Guid Id,
    string StorageKey,
    string Title,
    string Description,
    string Tags,
    DateTimeOffset CreatedAt);

public sealed record MediaReadUrlResult(string Url, DateTimeOffset ExpiresAt);

public sealed record DeleteVideoResult(string Message);

public sealed record MediaVideoListItemDto(
    Guid Id,
    Guid UserId,
    string Type,
    string StorageKey,
    string? Filename,
    string? OriginalName,
    string? MimeType,
    int? Size,
    string? Title,
    string? Description,
    string? Tags,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
