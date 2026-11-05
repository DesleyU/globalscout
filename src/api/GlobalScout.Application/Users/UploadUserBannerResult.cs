namespace GlobalScout.Application.Users;

public sealed record InitiateBannerUploadResult(
    string StorageKey,
    string UploadUrl,
    string HttpMethod,
    DateTimeOffset ExpiresAt);

public sealed record CompleteBannerUploadResult(
    string Message,
    string StorageKey,
    UserProfileApiDto Profile);

public sealed record BannerReadUrlResult(string Url, DateTimeOffset ExpiresAt);
