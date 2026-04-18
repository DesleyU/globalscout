using System.Reflection;
using System.Text.Json.Serialization;
using GlobalScout.Api.Infrastructure;
using GlobalScout.Api.Social.Messages;
using GlobalScout.Application;
using GlobalScout.Application.Abstractions.Social.Messages;
using GlobalScout.Infrastructure;
using GlobalScout.Infrastructure.Data;
using GlobalScout.Infrastructure.Identity;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Browser clients (Vite on another port, or hosted SPA) need CORS when not using same-origin /api proxy.
var configuredCorsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
var enableCors = configuredCorsOrigins.Length > 0 || builder.Environment.IsDevelopment();

if (enableCors)
{
    builder.Services.AddCors(options =>
    {
        options.AddDefaultPolicy(policy =>
        {
            // In Development we also accept any localhost variant (e.g. Aspire's reverse-proxy
            // hostname http://<resource>-<host>.dev.localhost:<port>), because GetEndpoint("http")
            // in the AppHost resolves to http://localhost:<port> rather than the proxy hostname
            // the browser actually sends as Origin, and WithOrigins(...) is a case-sensitive
            // exact-string match.
            if (builder.Environment.IsDevelopment())
            {
                policy.SetIsOriginAllowed(origin =>
                {
                    if (configuredCorsOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase))
                    {
                        return true;
                    }

                    if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri))
                    {
                        return false;
                    }

                    var host = uri.Host;
                    return host.Equals("localhost", StringComparison.OrdinalIgnoreCase)
                        || host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase)
                        || host.EndsWith(".localhost", StringComparison.OrdinalIgnoreCase);
                });
            }
            else
            {
                policy.WithOrigins(configuredCorsOrigins);
            }

            policy.AllowAnyHeader().AllowAnyMethod();
        });
    });
}

builder.Services.Configure<FormOptions>(o =>
{
    o.MultipartBodyLengthLimit = 524_288_000;
});

builder.Services.ConfigureHttpJsonOptions(o =>
{
    o.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

builder.AddServiceDefaults();

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddGlobalScoutAvatarStorage(
    builder.Configuration,
    builder.Environment.ContentRootPath,
    builder.Environment.WebRootPath);

builder.Services.AddGlobalScoutVideoStorage(
    builder.Configuration,
    builder.Environment.ContentRootPath,
    builder.Environment.WebRootPath);

builder.Services.AddOpenApi(options => options.AddScalarTransformers());

builder.Services.AddEndpoints(Assembly.GetExecutingAssembly());
builder.Services.AddSignalR();
builder.Services.AddScoped<IMessageRealtimeNotifier, SignalRMessageNotifier>();

var app = builder.Build();

if (enableCors)
{
    app.UseCors();
}

app.MapDefaultEndpoints();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseHttpsRedirection();

app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapHub<MessageHub>("/hubs/messages");

if (app.Environment.IsDevelopment() || app.Environment.IsEnvironment("IntegrationTesting"))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<GlobalScoutDbContext>();
    await db.Database.MigrateAsync();
}

await IdentityDataSeeder.SeedRolesAsync(app.Services);

app.MapEndpoints();

app.Run();
