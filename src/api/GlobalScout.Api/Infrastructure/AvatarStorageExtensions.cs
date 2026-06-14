using GlobalScout.Application.Abstractions.Files;

namespace GlobalScout.Api.Infrastructure;

public static class AvatarStorageExtensions
{
    /// <summary>
    /// Registers <see cref="IAvatarStorage"/> and binds <see cref="AvatarStorageOptions"/>.
    /// When <see cref="AvatarStorageOptions.PhysicalAvatarsDirectory"/> is empty, uses
    /// <paramref name="webRootPath"/> if set, otherwise <c>ContentRoot/wwwroot</c>, then <c>uploads/avatars</c>.
    /// </summary>
    public static IServiceCollection AddGlobalScoutAvatarStorage(
        this IServiceCollection services,
        IConfiguration configuration,
        string contentRootPath,
        string? webRootPath)
    {
        services
            .AddOptions<AvatarStorageOptions>()
            .Bind(configuration.GetSection(AvatarStorageOptions.SectionName))
            .PostConfigure(options =>
            {
                if (!string.IsNullOrWhiteSpace(options.PhysicalAvatarsDirectory))
                {
                    return;
                }

                var root = !string.IsNullOrWhiteSpace(webRootPath)
                    ? webRootPath
                    : Path.Combine(contentRootPath, "wwwroot");

                options.PhysicalAvatarsDirectory = Path.Combine(root, "uploads", "avatars");
            });

        services.AddScoped<IAvatarStorage, LocalAvatarStorage>();
        return services;
    }
}
