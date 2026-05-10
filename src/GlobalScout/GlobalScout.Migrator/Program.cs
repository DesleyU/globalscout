using GlobalScout.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

var builder = Host.CreateApplicationBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("globalscout");
ArgumentException.ThrowIfNullOrEmpty(connectionString);

builder.Services.AddDbContext<GlobalScoutDbContext>(options =>
{
    options.UseNpgsql(connectionString, npgsql =>
            npgsql.MigrationsHistoryTable("__ef_migrations_history", "public"))
        .UseSnakeCaseNamingConvention();
});

using var app = builder.Build();
using var scope = app.Services.CreateScope();

var logger = scope.ServiceProvider
    .GetRequiredService<ILoggerFactory>()
    .CreateLogger("GlobalScout.Migrator");

logger.LogInformation("Applying GlobalScout database migrations.");

var db = scope.ServiceProvider.GetRequiredService<GlobalScoutDbContext>();
await db.Database.MigrateAsync();

logger.LogInformation("GlobalScout database migrations completed.");
