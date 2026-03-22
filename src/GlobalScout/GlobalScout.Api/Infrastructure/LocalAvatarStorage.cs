using GlobalScout.Application.Abstractions.Files;
using GlobalScout.SharedKernel;
using Microsoft.Extensions.Options;

namespace GlobalScout.Api.Infrastructure;

internal sealed class LocalAvatarStorage(IOptions<AvatarStorageOptions> options) : IAvatarStorage
{
    private readonly AvatarStorageOptions _options = options.Value;

    public async Task<Result<string>> SaveAsync(
        Stream content,
        string originalFileName,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(_options.PhysicalAvatarsDirectory))
        {
            return Result.Failure<string>(
                Error.Problem(
                    "AvatarStorage.NotConfigured",
                    "AvatarStorage:PhysicalAvatarsDirectory is not configured."));
        }

        Directory.CreateDirectory(_options.PhysicalAvatarsDirectory);

        var ext = Path.GetExtension(originalFileName);
        if (string.IsNullOrEmpty(ext))
        {
            ext = ".bin";
        }

        var fileName = $"{Guid.NewGuid():N}{ext}";
        var physicalPath = Path.Combine(_options.PhysicalAvatarsDirectory, fileName);

        await using (var file = File.Create(physicalPath))
        {
            await content.CopyToAsync(file, cancellationToken);
        }

        var prefix = _options.PublicRequestPath.TrimEnd('/');
        return Result.Success($"{prefix}/{fileName}");
    }
}
