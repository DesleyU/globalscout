using Amazon;
using Amazon.Runtime;
using Amazon.S3;
using GlobalScout.Application.Abstractions.Files;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace GlobalScout.Infrastructure.Files;

internal static class FileStorageDependencyInjection
{
    public static IServiceCollection AddFileStorage(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<ObjectStorageOptions>(configuration.GetSection(ObjectStorageOptions.SectionName));
        services.AddSingleton<IAmazonS3>(sp =>
        {
            var options = sp.GetRequiredService<IOptions<ObjectStorageOptions>>().Value;
            if (!string.Equals(options.Provider, "S3", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException($"Unsupported file storage provider '{options.Provider}'.");
            }

            var config = new AmazonS3Config
            {
                RegionEndpoint = RegionEndpoint.GetBySystemName(options.Region),
                ForcePathStyle = options.ForcePathStyle
            };

            if (!string.IsNullOrWhiteSpace(options.EndpointUrl))
            {
                config.ServiceURL = options.EndpointUrl;
                config.AuthenticationRegion = options.Region;
            }

            if (!string.IsNullOrWhiteSpace(options.AccessKey) && !string.IsNullOrWhiteSpace(options.SecretKey))
            {
                return new AmazonS3Client(
                    new BasicAWSCredentials(options.AccessKey, options.SecretKey),
                    config);
            }

            return new AmazonS3Client(config);
        });

        services.AddSingleton<S3FileStorage>();
        services.AddSingleton<IFileStorage>(sp => sp.GetRequiredService<S3FileStorage>());
        services.AddSingleton<IFileStorageInitializer>(sp => sp.GetRequiredService<S3FileStorage>());
        services.AddSingleton<IAvatarUrlResolver, AvatarUrlResolver>();
        return services;
    }
}
