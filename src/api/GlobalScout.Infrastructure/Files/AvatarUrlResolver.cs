using GlobalScout.Application.Abstractions.Files;

namespace GlobalScout.Infrastructure.Files;

internal sealed class AvatarUrlResolver(IFileStorage fileStorage) : IAvatarUrlResolver
{
    public async Task<string?> ResolveAsync(string? storageKey, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(storageKey))
        {
            return null;
        }

        if (storageKey.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
            || storageKey.StartsWith("https://", StringComparison.OrdinalIgnoreCase)
            || storageKey.StartsWith("/", StringComparison.Ordinal))
        {
            return storageKey;
        }

        var readUrl = await fileStorage.CreateReadUrlAsync(storageKey, cancellationToken);
        return readUrl.IsSuccess ? readUrl.Value.Url : null;
    }
}
