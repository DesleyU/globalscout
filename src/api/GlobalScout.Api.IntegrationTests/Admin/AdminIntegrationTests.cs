using System.Net;
using System.Text.Json;
using GlobalScout.Api.IntegrationTests.Social;
using Xunit;

namespace GlobalScout.Api.IntegrationTests.Admin;

[Collection(nameof(IntegrationCollection))]
public sealed class AdminIntegrationTests
{
    private readonly IntegrationTestFixture _fixture;

    public AdminIntegrationTests(IntegrationTestFixture fixture) => _fixture = fixture;

    private CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task Get_stats_returns_200_for_admin()
    {
        (_, string token) = await AdminIntegrationTestHelpers.CreateAdminUserAsync(_fixture.Factory);

        using var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(_fixture.Factory, token);
        using var response = await client.GetAsync("/api/admin/stats", Ct);

        response.EnsureSuccessStatusCode();
        await using var stream = await response.Content.ReadAsStreamAsync(Ct);
        var doc = await JsonDocument.ParseAsync(stream, cancellationToken: Ct);
        Assert.True(doc.RootElement.TryGetProperty("stats", out JsonElement stats));
        Assert.True(stats.TryGetProperty("users", out _));
        Assert.True(stats.TryGetProperty("connections", out _));
    }

    [Fact]
    public async Task Get_stats_returns_403_for_non_admin()
    {
        (_, string token) = await _fixture.RegisterClubUserAsync(Ct);
        using var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(_fixture.Factory, token);
        using var response = await client.GetAsync("/api/admin/stats", Ct);
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Get_users_returns_200_for_admin()
    {
        (_, string token) = await AdminIntegrationTestHelpers.CreateAdminUserAsync(_fixture.Factory);

        using var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(_fixture.Factory, token);
        using var response = await client.GetAsync("/api/admin/users", Ct);
        response.EnsureSuccessStatusCode();
        await using var stream = await response.Content.ReadAsStreamAsync(Ct);
        var doc = await JsonDocument.ParseAsync(stream, cancellationToken: Ct);
        Assert.True(doc.RootElement.TryGetProperty("users", out _));
        Assert.True(doc.RootElement.TryGetProperty("pagination", out _));
    }
}
