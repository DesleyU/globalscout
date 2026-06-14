using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using GlobalScout.Api.IntegrationTests.Admin;
using GlobalScout.Api.IntegrationTests.Social;
using GlobalScout.Application.Abstractions.PlayerIdentity;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace GlobalScout.Api.IntegrationTests.PlayerIdentity;

[Collection(nameof(IntegrationCollection))]
public sealed class PlayerIdentityIntegrationTests
{
    private readonly IntegrationTestFixture _fixture;

    public PlayerIdentityIntegrationTests(IntegrationTestFixture fixture) => _fixture = fixture;

    private CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task Search_returns_matches_for_player()
    {
        var context = PlayerIdentityIntegrationTestHelpers.CreateContext(_fixture);
        var anon = context.Factory.CreateClient();
        var (_, token) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(context.Factory, Ct);
        var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(context.Factory, token);

        using var response = await PlayerIdentityIntegrationTestHelpers.SearchAsync(client, Ct);
        response.EnsureSuccessStatusCode();

        await using var stream = await response.Content.ReadAsStreamAsync(Ct);
        var doc = await JsonDocument.ParseAsync(stream, cancellationToken: Ct);
        var matches = doc.RootElement.GetProperty("matches");
        Assert.True(matches.GetArrayLength() > 0);
        Assert.Equal(
            context.FakeExternalPlayerId,
            matches[0].GetProperty("externalPlayerId").GetInt32());
    }

    [Fact]
    public async Task Search_passes_team_id_to_external_search()
    {
        var context = PlayerIdentityIntegrationTestHelpers.CreateContext(_fixture);
        var (_, token) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(context.Factory, Ct);
        var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(context.Factory, token);

        using var response = await PlayerIdentityIntegrationTestHelpers.SearchAsync(client, Ct);
        response.EnsureSuccessStatusCode();

        var fakeSearch = context.Factory.Services.GetRequiredService<IExternalPlayerSearch>()
            as FakeExternalPlayerSearch;
        Assert.NotNull(fakeSearch);
        Assert.NotNull(fakeSearch!.LastCriteria);
        Assert.Equal(529, fakeSearch.LastCriteria!.CurrentTeamId);
        Assert.Equal("Spain", fakeSearch.LastCriteria.CurrentCountry);
        Assert.Equal("FC Barcelona", fakeSearch.LastCriteria.CurrentClub);
        Assert.Equal("Pedri", fakeSearch.LastCriteria.FirstName);
        Assert.Equal("Gonzalez", fakeSearch.LastCriteria.LastName);
    }

    [Fact]
    public async Task Search_returns_403_for_non_player()
    {
        var context = PlayerIdentityIntegrationTestHelpers.CreateContext(_fixture);
        var anon = context.Factory.CreateClient();
        var (_, token) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(context.Factory, Ct);
        var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(context.Factory, token);

        using var response = await PlayerIdentityIntegrationTestHelpers.SearchAsync(client, Ct);
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Approve_claim_links_player_and_sets_verified_status()
    {
        var context = PlayerIdentityIntegrationTestHelpers.CreateContext(_fixture);
        var anon = context.Factory.CreateClient();
        var (_, playerToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(context.Factory, Ct);
        var player = SocialIntegrationTestHelpers.CreateAuthenticatedClient(context.Factory, playerToken);

        await PlayerIdentityIntegrationTestHelpers.SubmitClaimForReviewAsync(
            player,
            context.FakeExternalPlayerId,
            Ct);

        using var pendingClaim = await PlayerIdentityIntegrationTestHelpers.GetMyClaimAsync(player, Ct);
        pendingClaim.EnsureSuccessStatusCode();
        await using var pendingStream = await pendingClaim.Content.ReadAsStreamAsync(Ct);
        var pendingDoc = await JsonDocument.ParseAsync(pendingStream, cancellationToken: Ct);
        Assert.Equal("PendingVerification", pendingDoc.RootElement.GetProperty("status").GetString());
        Assert.True(pendingDoc.RootElement.GetProperty("claim").GetProperty("evidence").GetArrayLength() > 0);

        var claimId = await GetPlayerClaimIdAsync(player, Ct);

        var (_, adminToken) = await AdminIntegrationTestHelpers.CreateAdminUserAsync(context.Factory);
        var admin = SocialIntegrationTestHelpers.CreateAuthenticatedClient(context.Factory, adminToken);

        using var approve = await admin.PostAsJsonAsync(
            $"/api/admin/player-claims/{claimId}/approve",
            new { note = "Verified against official roster." },
            Ct);
        var approveBody = await approve.Content.ReadAsStringAsync(Ct);
        Assert.True(approve.IsSuccessStatusCode, approveBody);

        using var claimMe = await PlayerIdentityIntegrationTestHelpers.GetMyClaimAsync(player, Ct);
        claimMe.EnsureSuccessStatusCode();
        await using var claimStream = await claimMe.Content.ReadAsStreamAsync(Ct);
        var claimDoc = await JsonDocument.ParseAsync(claimStream, cancellationToken: Ct);
        Assert.Equal("Verified", claimDoc.RootElement.GetProperty("status").GetString());
        Assert.Equal("Verified", claimDoc.RootElement.GetProperty("claim").GetProperty("status").GetString());

        using var profile = await player.GetAsync("/api/users/profile", Ct);
        profile.EnsureSuccessStatusCode();
        await using var profileStream = await profile.Content.ReadAsStreamAsync(Ct);
        var profileDoc = await JsonDocument.ParseAsync(profileStream, cancellationToken: Ct);
        Assert.Equal(
            context.FakeExternalPlayerId,
            profileDoc.RootElement.GetProperty("playerId").GetInt32());
    }

    [Fact]
    public async Task Reject_claim_sets_rejected_status_and_allows_new_claim()
    {
        var context = PlayerIdentityIntegrationTestHelpers.CreateContext(_fixture);
        var anon = context.Factory.CreateClient();
        var (_, playerToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(context.Factory, Ct);
        var player = SocialIntegrationTestHelpers.CreateAuthenticatedClient(context.Factory, playerToken);

        await PlayerIdentityIntegrationTestHelpers.SubmitClaimForReviewAsync(
            player,
            context.FakeExternalPlayerId,
            Ct);
        var claimId = await GetPlayerClaimIdAsync(player, Ct);

        var (_, adminToken) = await AdminIntegrationTestHelpers.CreateAdminUserAsync(context.Factory);
        var admin = SocialIntegrationTestHelpers.CreateAuthenticatedClient(context.Factory, adminToken);

        using var reject = await admin.PostAsJsonAsync(
            $"/api/admin/player-claims/{claimId}/reject",
            new { note = "Evidence does not match the selected profile." },
            Ct);
        reject.EnsureSuccessStatusCode();

        using var claimMe = await PlayerIdentityIntegrationTestHelpers.GetMyClaimAsync(player, Ct);
        claimMe.EnsureSuccessStatusCode();
        await using var claimStream = await claimMe.Content.ReadAsStreamAsync(Ct);
        var claimDoc = await JsonDocument.ParseAsync(claimStream, cancellationToken: Ct);
        Assert.Equal("Rejected", claimDoc.RootElement.GetProperty("status").GetString());

        using var secondClaim = await PlayerIdentityIntegrationTestHelpers.CreateClaimAsync(
            player,
            context.FakeExternalPlayerId,
            Ct);
        secondClaim.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task Request_more_info_keeps_pending_status_and_stores_admin_note()
    {
        var context = PlayerIdentityIntegrationTestHelpers.CreateContext(_fixture);
        var anon = context.Factory.CreateClient();
        var (_, playerToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(context.Factory, Ct);
        var player = SocialIntegrationTestHelpers.CreateAuthenticatedClient(context.Factory, playerToken);

        await PlayerIdentityIntegrationTestHelpers.SubmitClaimForReviewAsync(
            player,
            context.FakeExternalPlayerId,
            Ct);
        var claimId = await GetPlayerClaimIdAsync(player, Ct);

        var (_, adminToken) = await AdminIntegrationTestHelpers.CreateAdminUserAsync(context.Factory);
        var admin = SocialIntegrationTestHelpers.CreateAuthenticatedClient(context.Factory, adminToken);
        const string note = "Please upload a federation registration card.";

        using var requestInfo = await admin.PostAsJsonAsync(
            $"/api/admin/player-claims/{claimId}/request-info",
            new { note },
            Ct);
        requestInfo.EnsureSuccessStatusCode();

        using var claimMe = await PlayerIdentityIntegrationTestHelpers.GetMyClaimAsync(player, Ct);
        claimMe.EnsureSuccessStatusCode();
        await using var claimStream = await claimMe.Content.ReadAsStreamAsync(Ct);
        var claimDoc = await JsonDocument.ParseAsync(claimStream, cancellationToken: Ct);
        Assert.Equal("PendingVerification", claimDoc.RootElement.GetProperty("status").GetString());
        Assert.Equal(note, claimDoc.RootElement.GetProperty("claim").GetProperty("adminNote").GetString());
    }

    private static async Task<Guid> GetPlayerClaimIdAsync(HttpClient playerClient, CancellationToken cancellationToken)
    {
        using var claimMe = await PlayerIdentityIntegrationTestHelpers.GetMyClaimAsync(playerClient, cancellationToken);
        claimMe.EnsureSuccessStatusCode();
        await using var stream = await claimMe.Content.ReadAsStreamAsync(cancellationToken);
        var doc = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
        return doc.RootElement.GetProperty("claim").GetProperty("id").GetGuid();
    }
}
