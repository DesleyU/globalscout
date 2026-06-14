using GlobalScout.Application.Abstractions.Files;
using GlobalScout.SharedKernel;
using Microsoft.Extensions.Options;

namespace GlobalScout.Api.Infrastructure;

internal sealed class LocalVideoStorage(IOptions<VideoStorageOptions> options) : IVideoStorage
{
    private readonly VideoStorageOptions _options = options.Value;

    public async Task<Result<string>> SaveAsync(
        Stream content,
        string originalFileName,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(_options.PhysicalVideosDirectory))
        {
            return Result.Failure<string>(
                Error.Problem(
                    "VideoStorage.NotConfigured",
                    "VideoStorage:PhysicalVideosDirectory is not configured."));
        }

        if (content.CanSeek)
        {
            if (content.Length == 0)
            {
                return Result.Failure<string>(
                    Error.Validation("Video.Empty", "No video file provided."));
            }

            if (content.Length > _options.MaxVideoBytes)
            {
                return Result.Failure<string>(
                    Error.Validation(
                        "Video.TooLarge",
                        $"Video must not exceed {_options.MaxVideoBytes / (1024 * 1024)} MB."));
            }
        }

        Directory.CreateDirectory(_options.PhysicalVideosDirectory);

        var ext = Path.GetExtension(originalFileName);
        if (string.IsNullOrEmpty(ext))
        {
            ext = ".bin";
        }

        var fileName = $"{Guid.NewGuid():N}{ext}";
        var physicalPath = Path.Combine(_options.PhysicalVideosDirectory, fileName);

        await using (var file = File.Create(physicalPath))
        {
            await content.CopyToAsync(file, cancellationToken);
        }

        var prefix = _options.PublicRequestPath.TrimEnd('/');
        return Result.Success($"{prefix}/{fileName}");
    }

    public Task<Result> DeleteByPublicUrlAsync(string publicUrl, CancellationToken cancellationToken)
    {
        _ = cancellationToken;
        if (string.IsNullOrWhiteSpace(_options.PhysicalVideosDirectory))
        {
            return Task.FromResult(Result.Failure(
                Error.Problem(
                    "VideoStorage.NotConfigured",
                    "VideoStorage:PhysicalVideosDirectory is not configured.")));
        }

        var name = Path.GetFileName(publicUrl);
        if (string.IsNullOrEmpty(name))
        {
            return Task.FromResult(Result.Failure(
                Error.Problem("Video.Delete.InvalidUrl", "Could not resolve video file path.")));
        }

        var physical = Path.Combine(_options.PhysicalVideosDirectory, name);
        if (File.Exists(physical))
        {
            File.Delete(physical);
        }

        return Task.FromResult(Result.Success());
    }
}
