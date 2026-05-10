namespace GlobalScout.Application.Abstractions.Files;

internal sealed class FileKeyGenerator : IFileKeyGenerator
{
    public string CreateAvatarKey(Guid userId, string originalFileName) =>
        CreateKey("avatars", userId, originalFileName);

    public string CreateVideoKey(Guid userId, string originalFileName) =>
        CreateKey("media/videos", userId, originalFileName);

    public bool IsAvatarKeyForUser(Guid userId, string storageKey) =>
        IsKeyForUser("avatars", userId, storageKey);

    public bool IsVideoKeyForUser(Guid userId, string storageKey) =>
        IsKeyForUser("media/videos", userId, storageKey);

    private static string CreateKey(string prefix, Guid userId, string originalFileName)
    {
        var ext = Path.GetExtension(originalFileName);
        if (string.IsNullOrWhiteSpace(ext))
        {
            ext = ".bin";
        }

        return $"{prefix}/{userId:N}/{Guid.NewGuid():N}{ext.ToLowerInvariant()}";
    }

    private static bool IsKeyForUser(string prefix, Guid userId, string storageKey)
    {
        var expectedPrefix = $"{prefix}/{userId:N}/";
        return storageKey.StartsWith(expectedPrefix, StringComparison.Ordinal);
    }
}
