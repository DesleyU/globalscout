namespace GlobalScout.Application.Media;

public sealed record UploadVideoResult(
    Guid Id,
    string Url,
    string Title,
    string Description,
    string Tags,
    DateTimeOffset CreatedAt);

public sealed record DeleteVideoResult(string Message);

public sealed record MediaVideoListItemDto(
    Guid Id,
    Guid UserId,
    string Type,
    string Url,
    string? Filename,
    string? OriginalName,
    string? MimeType,
    int? Size,
    string? Title,
    string? Description,
    string? Tags,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
