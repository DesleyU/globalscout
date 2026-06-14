using GlobalScout.Application.Abstractions.Files;

namespace GlobalScout.Api.Infrastructure;

public static class VideoStorageExtensions
{
    /// <summary>
    /// Registers <see cref="IVideoStorage"/> and binds <see cref="VideoStorageOptions"/>.
    /// When <see cref="VideoStorageOptions.PhysicalVideosDirectory"/> is empty, uses
    /// <paramref name="webRootPath"/> if set, otherwise ContentRoot/wwwroot, then <c>uploads/videos</c>.
    /// </summary>
    public static IServiceCollection AddGlobalScoutVideoStorage(
        this IServiceCollection services,
        IConfiguration configuration,
        string contentRootPath,
        string? webRootPath)
    {
        services
            .AddOptions<VideoStorageOptions>()
            .Bind(configuration.GetSection(VideoStorageOptions.SectionName))
            .PostConfigure(options =>
            {
                if (!string.IsNullOrWhiteSpace(options.PhysicalVideosDirectory))
                {
                    return;
                }

                var root = !string.IsNullOrWhiteSpace(webRootPath)
                    ? webRootPath
                    : Path.Combine(contentRootPath, "wwwroot");

                options.PhysicalVideosDirectory = Path.Combine(root, "uploads", "videos");
            });

        services.AddScoped<IVideoStorage, LocalVideoStorage>();
        return services;
    }
}
