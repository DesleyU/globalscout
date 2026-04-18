using System.Security.Claims;
using System.Text;
using GlobalScout.Application.Abstractions.Auth;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Authorization;
using GlobalScout.Application.Abstractions.Media;
using GlobalScout.Application.Abstractions.Social.Messages;
using GlobalScout.Application.Abstractions.Statistics;
using GlobalScout.Infrastructure.Auth;
using GlobalScout.Infrastructure.Media;
using GlobalScout.Infrastructure.Data;
using GlobalScout.Infrastructure.Identity;
using GlobalScout.Infrastructure.Social.Graph;
using GlobalScout.Infrastructure.Social.Messages;
using GlobalScout.Infrastructure.Statistics;
using GlobalScout.Domain.Identity;
using GlobalScout.Infrastructure.Users;
using GlobalScout.Infrastructure.Billing;
using GlobalScout.Application.Abstractions.Billing;
using EFCore.NamingConventions;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace GlobalScout.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration) =>
        services
            .AddDatabase(configuration)
            .AddGlobalScoutIdentity(configuration)
            .AddStripeBilling(configuration)
            .AddPersistenceHealthChecks(configuration);

    private static IServiceCollection AddDatabase(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        string? connectionString = configuration.GetConnectionString("globalscout");
        ArgumentException.ThrowIfNullOrEmpty(connectionString);

        services.AddDbContext<GlobalScoutDbContext>(options =>
        {
            options.UseNpgsql(connectionString, npgsql =>
                    npgsql.MigrationsHistoryTable("__ef_migrations_history", "public"))
                .UseSnakeCaseNamingConvention();
        });

        services.AddScoped<IUserDirectoryRepository, UserDirectoryRepository>();
        services.AddScoped<IAdminRepository, AdminRepository>();
        services.AddScoped<ISocialGraphRepository, SocialGraphRepository>();
        services.AddScoped<IMessageRepository, MessageRepository>();
        services.AddScoped<IMediaRepository, MediaRepository>();
        services.AddScoped<IUserIdentityStore, UserIdentityStore>();
        services.AddScoped<IPlayerStatisticsRepository, PlayerStatisticsRepository>();

        services.Configure<ApiFootballOptions>(configuration.GetSection(ApiFootballOptions.SectionName));
        services.AddSingleton<IStatisticsUpdateState, StatisticsUpdateState>();
        services.AddHttpClient<IApiFootballSeasonStatsProvider, ApiFootballSeasonStatsProvider>((sp, client) =>
        {
            var o = sp.GetRequiredService<IOptions<ApiFootballOptions>>().Value;
            client.BaseAddress = new Uri(o.BaseUrl.TrimEnd('/') + "/");
            if (!string.IsNullOrWhiteSpace(o.ApiKey))
            {
                client.DefaultRequestHeaders.TryAddWithoutValidation("X-RapidAPI-Key", o.ApiKey);
            }

            client.DefaultRequestHeaders.TryAddWithoutValidation("X-RapidAPI-Host", o.Host);
        });

        return services;
    }

    private static IServiceCollection AddStripeBilling(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<StripeOptions>(configuration.GetSection(StripeOptions.SectionName));
        services.AddScoped<IBillingCheckoutService, StripeBillingCheckoutService>();
        services.AddScoped<IBillingPortalService, StripeBillingPortalService>();
        services.AddScoped<IBillingWebhookProcessor, StripeWebhookProcessor>();
        services.AddScoped<IBillingEntitlementSync, BillingEntitlementSync>();
        return services;
    }

    private static IServiceCollection AddGlobalScoutIdentity(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<JwtOptions>(configuration.GetSection(JwtOptions.SectionName));

        services
            .AddIdentity<ApplicationUser, ApplicationRole>(options =>
            {
                options.Password.RequiredLength = 6;
                options.Password.RequireDigit = false;
                options.Password.RequireNonAlphanumeric = false;
                options.Password.RequireUppercase = false;
                options.Password.RequireLowercase = false;
                options.User.RequireUniqueEmail = true;
            })
            .AddEntityFrameworkStores<GlobalScoutDbContext>()
            .AddDefaultTokenProviders();

        var jwt = configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>()
                  ?? throw new InvalidOperationException($"Configuration section '{JwtOptions.SectionName}' is missing.");

        if (string.IsNullOrWhiteSpace(jwt.SigningKey) || jwt.SigningKey.Length < 32)
        {
            throw new InvalidOperationException(
                $"Jwt:{nameof(JwtOptions.SigningKey)} must be at least 32 characters.");
        }

        services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwt.Issuer,
                    ValidAudience = jwt.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.SigningKey)),
                    RoleClaimType = ClaimTypes.Role
                };

                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        var accessToken = context.Request.Query["access_token"];
                        var path = context.HttpContext.Request.Path;
                        if (!string.IsNullOrEmpty(accessToken)
                            && path.StartsWithSegments("/hubs"))
                        {
                            context.Token = accessToken;
                        }

                        return Task.CompletedTask;
                    }
                };
            });

        services.AddAuthorization(options =>
        {
            options.AddPolicy(
                AuthorizationPolicyNames.Admin,
                policy => policy.RequireRole(AppRoleNames.Admin));
        });
        services.AddScoped<IJwtTokenIssuer, JwtTokenIssuer>();

        return services;
    }

    private static IServiceCollection AddPersistenceHealthChecks(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddHealthChecks()
            .AddNpgSql(configuration.GetConnectionString("globalscout")!);

        return services;
    }
}
