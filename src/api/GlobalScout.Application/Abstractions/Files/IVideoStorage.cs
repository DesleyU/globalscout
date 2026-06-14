using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Abstractions.Files;

public interface IVideoStorage
{
    /// <summary>Persists the file and returns the public URL path (e.g. /uploads/videos/...).</summary>
    Task<Result<string>> SaveAsync(
        Stream content,
        string originalFileName,
        CancellationToken cancellationToken);

    /// <summary>Deletes the file for a stored public URL; succeeds if the file is already missing.</summary>
    Task<Result> DeleteByPublicUrlAsync(string publicUrl, CancellationToken cancellationToken);
}
