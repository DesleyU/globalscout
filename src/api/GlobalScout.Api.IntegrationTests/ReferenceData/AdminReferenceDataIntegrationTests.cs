using System.Net;
using System.Text.Json;
using GlobalScout.Api.IntegrationTests.Admin;
using GlobalScout.Api.IntegrationTests.Social;
using GlobalScout.Application.Abstractions.ReferenceData;
using GlobalScout.Domain.ReferenceData;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace GlobalScout.Api.IntegrationTests.ReferenceData;

[Collection(nameof(IntegrationCollection))]
public sealed class AdminReferenceDataIntegrationTests
{
    private readonly IntegrationTestFixture _fixture;

    public AdminReferenceDataIntegrationTests(IntegrationTestFixture fixture) =>
        _fixture = fixture;

    private CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task Get_countries_returns_200_for_admin()
    {
        (_, string token) = await AdminIntegrationTestHelpers.CreateAdminUserAsync(_fixture.Factory);

        using var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(_fixture.Factory, token);
        using var response = await client.GetAsync("/api/admin/reference-data/countries", Ct);

        response.EnsureSuccessStatusCode();
        await using var stream = await response.Content.ReadAsStreamAsync(Ct);
        var doc = await JsonDocument.ParseAsync(stream, cancellationToken: Ct);
        Assert.True(doc.RootElement.TryGetProperty("countries", out JsonElement countries));
        Assert.True(countries.GetArrayLength() > 0);
    }

    [Fact]
    public async Task Get_countries_returns_403_for_non_admin()
    {
        (_, string token) = await _fixture.RegisterClubUserAsync(Ct);
        using var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(_fixture.Factory, token);
        using var response = await client.GetAsync("/api/admin/reference-data/countries", Ct);
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Set_league_level_persists_and_rejected_league_is_hidden_from_search()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var catalog = scope.ServiceProvider.GetRequiredService<IReferenceDataCatalog>();
        var providerCompetitionName = $"Admin Review League {Guid.NewGuid():N}";
        var upsert = await catalog.UpsertProviderCompetitionsAsync(
            "RO",
            [new ExternalFootballCompetition(9_910_001, providerCompetitionName, "League", null)],
            Ct);
        var competitionId = upsert.Items[0].Id;

        (_, string adminToken) = await AdminIntegrationTestHelpers.CreateAdminUserAsync(_fixture.Factory);
        using var adminClient = SocialIntegrationTestHelpers.CreateAuthenticatedClient(
            _fixture.Factory,
            adminToken);

        using var setLevelResponse = await adminClient.PutAsJsonAsync(
            $"/api/admin/reference-data/competitions/{competitionId}/level",
            new { level = "ProfessionalTier2" },
            Ct);
        setLevelResponse.EnsureSuccessStatusCode();

        var submitted = await catalog.TrySubmitCompetitionAsync(
            "RO",
            $"Pending League {Guid.NewGuid():N}",
            CompetitionLevel.YouthAcademy,
            CompetitionType.League,
            Guid.NewGuid(),
            5,
            Ct);
        Assert.NotNull(submitted);
        var pendingId = submitted!.Id;

        using var rejectResponse = await adminClient.PostAsync(
            $"/api/admin/reference-data/competitions/{pendingId}/reject",
            null,
            Ct);
        rejectResponse.EnsureSuccessStatusCode();

        (_, string playerToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(
            _fixture.Factory,
            Ct);
        using var playerClient = SocialIntegrationTestHelpers.CreateAuthenticatedClient(
            _fixture.Factory,
            playerToken);
        using var searchResponse = await playerClient.PostAsJsonAsync(
            "/api/reference-data/football/competitions/search",
            new { country = "Romania", searchTerm = submitted.Name },
            Ct);
        searchResponse.EnsureSuccessStatusCode();
        await using var searchStream = await searchResponse.Content.ReadAsStreamAsync(Ct);
        var searchDoc = await JsonDocument.ParseAsync(searchStream, cancellationToken: Ct);
        var competitions = searchDoc.RootElement.GetProperty("leagues");
        Assert.Equal(0, competitions.GetArrayLength());
    }
}
