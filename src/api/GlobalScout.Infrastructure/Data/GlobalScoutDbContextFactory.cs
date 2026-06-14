using EFCore.NamingConventions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace GlobalScout.Infrastructure.Data;

public sealed class GlobalScoutDbContextFactory : IDesignTimeDbContextFactory<GlobalScoutDbContext>
{
    public GlobalScoutDbContext CreateDbContext(string[] args)
    {
        var basePath = Path.Combine(Directory.GetCurrentDirectory(), "..", "GlobalScout.Api");
        var configuration = new ConfigurationBuilder()
            .SetBasePath(basePath)
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var connectionString = configuration.GetConnectionString("globalscout")
                               ?? "Host=localhost;Port=5432;Database=globalscout;Username=postgres;Password=postgres";

        var optionsBuilder = new DbContextOptionsBuilder<GlobalScoutDbContext>();
        optionsBuilder.UseNpgsql(connectionString, npgsql =>
                npgsql.MigrationsHistoryTable("__ef_migrations_history", "public"))
            .UseSnakeCaseNamingConvention();

        return new GlobalScoutDbContext(optionsBuilder.Options);
    }
}
