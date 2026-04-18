using System.Net;
using System.Text.Json;
using GlobalScout.Api.IntegrationTests.Social;
using GlobalScout.Api.IntegrationTests.Stats;
using GlobalScout.Domain.Identity;
using Xunit;

namespace GlobalScout.Api.IntegrationTests.Account;

[Collection(nameof(IntegrationCollection))]
public sealed class AccountIntegrationTests
{
    private readonly IntegrationTestFixture _fixture;

    public AccountIntegrationTests(IntegrationTestFixture fixture) => _fixture = fixture;

    private CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task Get_account_info_returns_401_without_token()
    {
        using var client = _fixture.Factory.CreateClient();
        using var response = await client.GetAsync("/api/account/info", Ct);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Get_account_info_returns_legacy_shape_for_basic_user()
    {
        (_, string token) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(_fixture.Factory.CreateClient(), Ct);
        using var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(_fixture.Factory, token);
        using var response = await client.GetAsync("/api/account/info", Ct);
        response.EnsureSuccessStatusCode();
        await using var stream = await response.Content.ReadAsStreamAsync(Ct);
        var doc = await JsonDocument.ParseAsync(stream, cancellationToken: Ct);
        var root = doc.RootElement;
        Assert.True(root.GetProperty("success").GetBoolean());
        var data = root.GetProperty("data");
        Assert.Equal("BASIC", data.GetProperty("accountType").GetString());
        Assert.True(data.TryGetProperty("email", out _));
        Assert.True(data.TryGetProperty("createdAt", out _));
        var limits = data.GetProperty("limits");
        Assert.Equal(10, limits.GetProperty("maxConnections").GetInt32());
        Assert.Equal(1, limits.GetProperty("maxVideos").GetInt32());
        Assert.False(limits.GetProperty("visitorDetails").GetBoolean());
        Assert.Equal(JsonValueKind.Array, limits.GetProperty("statsFields").ValueKind);
        Assert.Contains("rating", limits.GetProperty("statsFields").EnumerateArray().Select(e => e.GetString()));
    }

    [Fact]
    public async Task Post_upgrade_then_downgrade_round_trip()
    {
        (_, string token) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(_fixture.Factory.CreateClient(), Ct);
        using var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(_fixture.Factory, token);

        using (var up = await client.PostAsync("/api/account/upgrade", null, Ct))
        {
            up.EnsureSuccessStatusCode();
            await using var stream = await up.Content.ReadAsStreamAsync(Ct);
            var doc = await JsonDocument.ParseAsync(stream, cancellationToken: Ct);
            Assert.True(doc.RootElement.GetProperty("success").GetBoolean());
            Assert.Equal("PREMIUM", doc.RootElement.GetProperty("data").GetProperty("accountType").GetString());
        }

        using (var info = await client.GetAsync("/api/account/info", Ct))
        {
            info.EnsureSuccessStatusCode();
            await using var stream = await info.Content.ReadAsStreamAsync(Ct);
            var doc = await JsonDocument.ParseAsync(stream, cancellationToken: Ct);
            Assert.Equal("PREMIUM", doc.RootElement.GetProperty("data").GetProperty("accountType").GetString());
            var limits = doc.RootElement.GetProperty("data").GetProperty("limits");
            Assert.Equal("all", limits.GetProperty("statsFields").GetString());
        }

        using (var down = await client.PostAsync("/api/account/downgrade", null, Ct))
        {
            down.EnsureSuccessStatusCode();
            await using var stream = await down.Content.ReadAsStreamAsync(Ct);
            var doc = await JsonDocument.ParseAsync(stream, cancellationToken: Ct);
            Assert.Equal("BASIC", doc.RootElement.GetProperty("data").GetProperty("accountType").GetString());
        }
    }

    [Fact]
    public async Task Post_upgrade_when_already_premium_returns_400()
    {
        (_, string token) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(_fixture.Factory.CreateClient(), Ct);
        using var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(_fixture.Factory, token);
        using (var first = await client.PostAsync("/api/account/upgrade", null, Ct))
        {
            first.EnsureSuccessStatusCode();
        }

        using var second = await client.PostAsync("/api/account/upgrade", null, Ct);
        Assert.Equal(HttpStatusCode.BadRequest, second.StatusCode);
    }

    [Fact]
    public async Task Post_downgrade_when_already_basic_returns_400()
    {
        (_, string token) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(_fixture.Factory.CreateClient(), Ct);
        using var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(_fixture.Factory, token);
        using var response = await client.PostAsync("/api/account/downgrade", null, Ct);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Post_downgrade_when_premium_succeeds()
    {
        (Guid userId, string token) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(_fixture.Factory.CreateClient(), Ct);
        await StatsIntegrationTestHelpers.SetAccountTypeAsync(_fixture.Factory, userId, AccountType.Premium, Ct);
        using var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(_fixture.Factory, token);
        using var response = await client.PostAsync("/api/account/downgrade", null, Ct);
        response.EnsureSuccessStatusCode();
    }
}
