using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Abstractions.Files;

public interface IAvatarStorage
{
    /// <summary>Persists the file and returns the public URL path (e.g. /uploads/avatars/...).</summary>
    Task<Result<string>> SaveAsync(Stream content, string originalFileName, CancellationToken cancellationToken);
}
