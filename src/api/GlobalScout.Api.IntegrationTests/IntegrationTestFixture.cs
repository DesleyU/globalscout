using GlobalScout.Api.IntegrationTests.Social;
using DotNet.Testcontainers.Builders;
using DotNet.Testcontainers.Containers;
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

    private readonly IContainer _ministack = new ContainerBuilder()
        .WithImage("ministackorg/ministack")
        .WithPortBinding(4566, true)
        .Build();

    public WebApplicationFactory<Program> Factory { get; private set; } = null!;

    /// <summary>Registers a club user through <c>POST /api/auth/register</c> (shared IT database).</summary>
    public Task<(Guid UserId, string Token)> RegisterClubUserAsync(CancellationToken cancellationToken) =>
        SocialIntegrationTestHelpers.RegisterClubUserAsync(Factory, cancellationToken);

    public async ValueTask InitializeAsync()
    {
        await _postgres.StartAsync();
        await _ministack.StartAsync();

        string connectionString = _postgres.GetConnectionString();
        string ministackEndpoint = $"http://{_ministack.Hostname}:{_ministack.GetMappedPublicPort(4566)}";
        await WaitForMiniStackAsync(ministackEndpoint);

        Factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("IntegrationTesting");
            builder.UseSetting("ConnectionStrings:globalscout", connectionString);
            builder.UseSetting("ObjectStorage:BucketName", $"globalscout-it-{Guid.NewGuid():N}");
            builder.UseSetting("ObjectStorage:Region", "us-east-1");
            builder.UseSetting("ObjectStorage:EndpointUrl", ministackEndpoint);
            builder.UseSetting("ObjectStorage:AccessKey", "test");
            builder.UseSetting("ObjectStorage:SecretKey", "test");
            builder.UseSetting("ObjectStorage:ForcePathStyle", "true");
            builder.UseSetting("ObjectStorage:CreateBucketIfMissing", "true");
        });
    }

    public async ValueTask DisposeAsync()
    {
        if (Factory is not null)
        {
            await Factory.DisposeAsync();
        }

        await _postgres.DisposeAsync();
        await _ministack.DisposeAsync();
    }

    private static async Task WaitForMiniStackAsync(string endpoint)
    {
        using var client = new HttpClient();
        for (var i = 0; i < 30; i++)
        {
            try
            {
                using var response = await client.GetAsync(endpoint);
                if ((int)response.StatusCode < 500)
                {
                    return;
                }
            }
            catch (HttpRequestException)
            {
            }

            await Task.Delay(TimeSpan.FromMilliseconds(500));
        }
    }
}
