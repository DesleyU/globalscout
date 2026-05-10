namespace GlobalScout.Application.Users;

public sealed record UploadUserAvatarResult(string Message, string Avatar, UserProfileApiDto Profile);

public sealed record InitiateAvatarUploadResult(
    string StorageKey,
    string UploadUrl,
    string HttpMethod,
    DateTimeOffset ExpiresAt);

public sealed record CompleteAvatarUploadResult(
    string Message,
    string StorageKey,
    UserProfileApiDto Profile);

public sealed record AvatarReadUrlResult(string Url, DateTimeOffset ExpiresAt);
