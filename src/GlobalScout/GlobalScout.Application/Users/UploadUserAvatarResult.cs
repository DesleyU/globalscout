namespace GlobalScout.Application.Users;

public sealed record UploadUserAvatarResult(string Message, string Avatar, UserProfileApiDto Profile);
