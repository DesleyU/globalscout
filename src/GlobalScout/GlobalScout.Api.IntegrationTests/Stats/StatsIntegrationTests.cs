using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using GlobalScout.Api.IntegrationTests.Admin;
using GlobalScout.Api.IntegrationTests.Social;
using GlobalScout.Application.Subscriptions;
using GlobalScout.Domain.Identity;
using Xunit;

namespace GlobalScout.Api.IntegrationTests.Stats;

[Collection(nameof(IntegrationCollection))]
public sealed class StatsIntegrationTests
{
    private readonly IntegrationTestFixture _fixture;

    public StatsIntegrationTests(IntegrationTestFixture fixture) => _fixture = fixture;

    private CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task Get_stats_me_returns_401_without_token()
    {
        using var client = _fixture.Factory.CreateClient();
        using var response = await client.GetAsync("/api/stats/me", Ct);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Get_stats_me_returns_envelope_for_player()
    {
        (_, string token) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(_fixture.Factory.CreateClient(), Ct);
        using var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(_fixture.Factory, token);
        using var response = await client.GetAsync("/api/stats/me", Ct);
        response.EnsureSuccessStatusCode();
        await using var stream = await response.Content.ReadAsStreamAsync(Ct);
        var doc = await JsonDocument.ParseAsync(stream, cancellationToken: Ct);
        JsonElement root = doc.RootElement;
        Assert.True(root.GetProperty("success").GetBoolean());
        Assert.Equal("BASIC", root.GetProperty("accountType").GetString());
        Assert.Equal("all", root.GetProperty("availableFields").GetString());
        Assert.Equal(0, root.GetProperty("totalSeasons").GetInt32());
        Assert.True(root.TryGetProperty("data", out JsonElement data) && data.ValueKind == JsonValueKind.Array);
    }

    [Fact]
    public async Task Put_stats_me_then_get_reflects_row()
    {
        (_, string token) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(_fixture.Factory.CreateClient(), Ct);
        using var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(_fixture.Factory, token);

        using (var put = await client.PutAsJsonAsync(
                   "/api/stats/me",
                   new { season = "2024", goals = 7, assists = 2 },
                   Ct))
        {
            put.EnsureSuccessStatusCode();
        }

        using var get = await client.GetAsync("/api/stats/me", Ct);
        get.EnsureSuccessStatusCode();
        await using var stream = await get.Content.ReadAsStreamAsync(Ct);
        var doc = await JsonDocument.ParseAsync(stream, cancellationToken: Ct);
        JsonElement data = doc.RootElement.GetProperty("data");
        Assert.Equal(1, data.GetArrayLength());
        JsonElement first = data[0];
        Assert.Equal(7, first.GetProperty("goals").GetInt32());
        Assert.Equal(2, first.GetProperty("assists").GetInt32());
        Assert.Equal("2024", first.GetProperty("season").GetString());
    }

    [Fact]
    public async Task Put_stats_me_empty_season_returns_400()
    {
        (_, string token) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(_fixture.Factory.CreateClient(), Ct);
        using var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(_fixture.Factory, token);
        using var response = await client.PutAsJsonAsync("/api/stats/me", new { season = "" }, Ct);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Get_stats_user_returns_404_for_unknown_user()
    {
        (_, string token) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(_fixture.Factory.CreateClient(), Ct);
        using var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(_fixture.Factory, token);
        using var response = await client.GetAsync($"/api/stats/user/{Guid.NewGuid()}", Ct);
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Get_stats_user_masks_basic_peer_stats()
    {
        (_, string viewerToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(_fixture.Factory.CreateClient(), Ct);
        (Guid targetId, string targetToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(_fixture.Factory.CreateClient(), Ct);

        using (var targetClient = SocialIntegrationTestHelpers.CreateAuthenticatedClient(_fixture.Factory, targetToken))
        {
            using var put = await targetClient.PutAsJsonAsync(
                "/api/stats/me",
                new { season = "2024", goals = 5, minutes = 900 },
                Ct);
            put.EnsureSuccessStatusCode();
        }

        using var viewerClient = SocialIntegrationTestHelpers.CreateAuthenticatedClient(_fixture.Factory, viewerToken);
        using var response = await viewerClient.GetAsync($"/api/stats/user/{targetId}", Ct);
        response.EnsureSuccessStatusCode();
        await using var stream = await response.Content.ReadAsStreamAsync(Ct);
        var doc = await JsonDocument.ParseAsync(stream, cancellationToken: Ct);
        JsonElement root = doc.RootElement;
        Assert.True(root.GetProperty("success").GetBoolean());
        Assert.Equal("BASIC", root.GetProperty("accountType").GetString());
        JsonElement available = root.GetProperty("availableFields");
        Assert.Equal(JsonValueKind.Array, available.ValueKind);
        var allowed = new HashSet<string>();
        foreach (JsonElement e in available.EnumerateArray())
        {
            allowed.Add(e.GetString()!);
        }

        foreach (string key in SubscriptionLimits.BasicTierVisibleStatKeys)
        {
            Assert.Contains(key, allowed);
        }

        JsonElement row = root.GetProperty("data")[0];
        Assert.False(row.TryGetProperty("shotsTotal", out _), "Masked BASIC peer stats should not expose shotsTotal.");
    }

    [Fact]
    public async Task Get_stats_user_shows_full_stats_for_premium_target()
    {
        (_, string viewerToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(_fixture.Factory.CreateClient(), Ct);
        (Guid targetId, string targetToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(_fixture.Factory.CreateClient(), Ct);

        await StatsIntegrationTestHelpers.SetAccountTypeAsync(_fixture.Factory, targetId, AccountType.Premium, Ct);

        using (var targetClient = SocialIntegrationTestHelpers.CreateAuthenticatedClient(_fixture.Factory, targetToken))
        {
            using var put = await targetClient.PutAsJsonAsync(
                "/api/stats/me",
                new { season = "2024", goals = 1, shotsTotal = 42 },
                Ct);
            put.EnsureSuccessStatusCode();
        }

        using var viewerClient = SocialIntegrationTestHelpers.CreateAuthenticatedClient(_fixture.Factory, viewerToken);
        using var response = await viewerClient.GetAsync($"/api/stats/user/{targetId}", Ct);
        response.EnsureSuccessStatusCode();
        await using var stream = await response.Content.ReadAsStreamAsync(Ct);
        var doc = await JsonDocument.ParseAsync(stream, cancellationToken: Ct);
        JsonElement root = doc.RootElement;
        Assert.Equal("all", root.GetProperty("availableFields").GetString());
        JsonElement row = root.GetProperty("data")[0];
        Assert.Equal(42, row.GetProperty("shotsTotal").GetInt32());
    }

    [Fact]
    public async Task Post_stats_refresh_returns_400_when_no_player_id()
    {
        (_, string token) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(_fixture.Factory.CreateClient(), Ct);
        using var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(_fixture.Factory, token);
        using var response = await client.PostAsync("/api/stats/refresh", null, Ct);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Post_stats_refresh_all_returns_403_for_non_admin()
    {
        (_, string token) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(_fixture.Factory.CreateClient(), Ct);
        using var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(_fixture.Factory, token);
        using var response = await client.PostAsync("/api/stats/refresh/all", null, Ct);
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Post_stats_refresh_all_returns_200_for_admin()
    {
        (_, string token) = await AdminIntegrationTestHelpers.CreateAdminUserAsync(_fixture.Factory);
        using var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(_fixture.Factory, token);
        using var response = await client.PostAsync("/api/stats/refresh/all", null, Ct);
        response.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task Get_stats_update_status_returns_shape()
    {
        (_, string token) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(_fixture.Factory.CreateClient(), Ct);
        using var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(_fixture.Factory, token);
        using var response = await client.GetAsync("/api/stats/update-status", Ct);
        response.EnsureSuccessStatusCode();
        await using var stream = await response.Content.ReadAsStreamAsync(Ct);
        var doc = await JsonDocument.ParseAsync(stream, cancellationToken: Ct);
        JsonElement status = doc.RootElement.GetProperty("status");
        Assert.True(status.TryGetProperty("isUpdating", out JsonElement isUpdating));
        _ = isUpdating.GetBoolean();
        Assert.True(status.TryGetProperty("queueSize", out _));
    }
}
