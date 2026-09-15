using Amazon;
using Amazon.Runtime;
using Amazon.SimpleEmail;
using GlobalScout.Application.Abstractions.Email;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace GlobalScout.Infrastructure.Auth.Email;

internal static class EmailDependencyInjection
{
    public static IServiceCollection AddEmail(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<EmailOptions>(configuration.GetSection(EmailOptions.SectionName));
        services.AddSingleton<IAmazonSimpleEmailService>(sp =>
        {
            var options = sp.GetRequiredService<IOptions<EmailOptions>>().Value;
            if (!string.Equals(options.Provider, "Ses", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException($"Unsupported email provider '{options.Provider}'.");
            }

            var config = new AmazonSimpleEmailServiceConfig
            {
                RegionEndpoint = RegionEndpoint.GetBySystemName(options.Region)
            };

            if (!string.IsNullOrWhiteSpace(options.EndpointUrl))
            {
                config.ServiceURL = options.EndpointUrl;
                config.AuthenticationRegion = options.Region;
            }

            if (!string.IsNullOrWhiteSpace(options.AccessKey) && !string.IsNullOrWhiteSpace(options.SecretKey))
            {
                return new AmazonSimpleEmailServiceClient(
                    new BasicAWSCredentials(options.AccessKey, options.SecretKey),
                    config);
            }

            return new AmazonSimpleEmailServiceClient(config);
        });

        services.AddSingleton<IEmailSender, SesEmailSender>();
        services.AddSingleton<VerificationEmailContent>();
        return services;
    }
}
