using GlobalScout.Api.IntegrationTests.Social;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Testcontainers.PostgreSql;
using Xunit;

namespace GlobalScout.Api.IntegrationTests;

public sealed class IntegrationTestFixture : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithDatabase($"globalscout_it_{Guid.NewGuid():N}")
        .Build();

    public WebApplicationFactory<Program> Factory { get; private set; } = null!;

    /// <summary>Registers a club user through <c>POST /api/auth/register</c> (shared IT database).</summary>
    public Task<(Guid UserId, string Token)> RegisterClubUserAsync(CancellationToken cancellationToken) =>
        SocialIntegrationTestHelpers.RegisterClubUserAsync(Factory.CreateClient(), cancellationToken);

    public async ValueTask InitializeAsync()
    {
        await _postgres.StartAsync();

        string connectionString = _postgres.GetConnectionString();

        Factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("IntegrationTesting");
            builder.UseSetting("ConnectionStrings:globalscout", connectionString);
        });
    }

    public async ValueTask DisposeAsync()
    {
        if (Factory is not null)
        {
            await Factory.DisposeAsync();
        }

        await _postgres.DisposeAsync();
    }
}
