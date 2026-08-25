using System.Net.Http.Json;
using GlobalScout.Api.IntegrationTests.Social;
using GlobalScout.Application.Abstractions.ReferenceData;
using GlobalScout.Domain.ReferenceData;
using GlobalScout.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace GlobalScout.Api.IntegrationTests.ReferenceData;

[Collection(nameof(IntegrationCollection))]
public sealed class ReferenceDataCatalogIntegrationTests
{
    private readonly IntegrationTestFixture _fixture;

    public ReferenceDataCatalogIntegrationTests(IntegrationTestFixture fixture) => _fixture = fixture;

    private CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task Team_search_is_accent_insensitive_and_ranks_exact_matches_first()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var catalog = scope.ServiceProvider.GetRequiredService<IReferenceDataCatalog>();

        await catalog.UpsertProviderTeamsAsync(
            "RO",
            [
                new ExternalFootballTeam(9_900_001, "Știința București", "STB", 1948, false, null),
                new ExternalFootballTeam(9_900_002, "Știința Cluj", "STC", 1919, false, null)
            ],
            Ct);

        var results = await catalog.SearchTeamsAsync(
            "RO",
            "stiinta bucuresti",
            requiresExternalId: false,
            25,
            Ct);

        Assert.Equal(2, results.Count);
        Assert.Equal("Știința București", results[0].Name);
        Assert.NotEqual(Guid.Empty, results[0].Id);
        Assert.True(results[0].IsVerified);
    }

    [Fact]
    public async Task Team_search_can_exclude_rows_without_an_external_id()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var catalog = scope.ServiceProvider.GetRequiredService<IReferenceDataCatalog>();
        var db = scope.ServiceProvider.GetRequiredService<GlobalScoutDbContext>();
        var now = DateTimeOffset.UtcNow;
        var name = $"No External Id {Guid.NewGuid():N}";
        db.Teams.Add(new Team
        {
            Id = Guid.NewGuid(),
            CountryCode = "RO",
            Name = name,
            NameNormalized = name.ToLowerInvariant(),
            Source = ReferenceDataSource.UserSubmitted,
            Status = ReferenceDataStatus.Pending,
            CreatedAt = now,
            UpdatedAt = now
        });
        await db.SaveChangesAsync(Ct);

        var allResults = await catalog.SearchTeamsAsync(
            "RO",
            name,
            requiresExternalId: false,
            25,
            Ct);
        var externalResults = await catalog.SearchTeamsAsync(
            "RO",
            name,
            requiresExternalId: true,
            25,
            Ct);

        Assert.Contains(allResults, team => team.Name == name);
        Assert.DoesNotContain(externalResults, team => team.Name == name);
    }

    [Fact]
    public async Task Team_search_ranks_prefix_matches_before_substring_matches()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var catalog = scope.ServiceProvider.GetRequiredService<IReferenceDataCatalog>();

        await catalog.UpsertProviderTeamsAsync(
            "RO",
            [
                new ExternalFootballTeam(9_932_001, "Alpha United", "ALU", null, false, null),
                new ExternalFootballTeam(9_932_002, "Beta Alpha FC", "BAF", null, false, null)
            ],
            Ct);

        var results = await catalog.SearchTeamsAsync(
            "RO",
            "alpha",
            requiresExternalId: false,
            25,
            Ct);

        Assert.Equal(2, results.Count);
        Assert.Equal("Alpha United", results[0].Name);
    }

    [Fact]
    public async Task Provider_team_upsert_dedupes_by_external_id_and_updates_metadata()
    {
        const int externalTeamId = 9_933_001;
        using var scope = _fixture.Factory.Services.CreateScope();
        var catalog = scope.ServiceProvider.GetRequiredService<IReferenceDataCatalog>();
        var db = scope.ServiceProvider.GetRequiredService<GlobalScoutDbContext>();

        var first = await catalog.UpsertProviderTeamsAsync(
            "RO",
            [new ExternalFootballTeam(externalTeamId, "Original FC", "ORI", 1900, false, "old-logo")],
            Ct);
        Assert.Equal(1, first.AddedCount);
        Assert.Equal(0, first.UpdatedCount);

        var second = await catalog.UpsertProviderTeamsAsync(
            "RO",
            [new ExternalFootballTeam(externalTeamId, "Renamed FC", "REN", 1901, false, "new-logo")],
            Ct);
        Assert.Equal(0, second.AddedCount);
        Assert.Equal(1, second.UpdatedCount);

        Assert.Equal(
            1,
            await db.Teams.CountAsync(team => team.ExternalTeamId == externalTeamId, Ct));

        var stored = await db.Teams.AsNoTracking().SingleAsync(
            team => team.ExternalTeamId == externalTeamId,
            Ct);
        Assert.Equal("Renamed FC", stored.Name);
        Assert.Equal("new-logo", stored.LogoUrl);
        Assert.Equal(1901, stored.Founded);
    }

    [Fact]
    public async Task Provider_team_refresh_preserves_admin_curated_fields()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var catalog = scope.ServiceProvider.GetRequiredService<IReferenceDataCatalog>();
        var db = scope.ServiceProvider.GetRequiredService<GlobalScoutDbContext>();
        const int externalTeamId = 9_934_001;

        await catalog.UpsertProviderTeamsAsync(
            "RO",
            [new ExternalFootballTeam(externalTeamId, "Provider Team", "PRV", 1920, false, "old-logo")],
            Ct);

        var team = await db.Teams.SingleAsync(item => item.ExternalTeamId == externalTeamId, Ct);
        team.Name = "Admin Team";
        team.NameNormalized = "admin team";
        team.Source = ReferenceDataSource.AdminCurated;
        await db.SaveChangesAsync(Ct);
        db.ChangeTracker.Clear();

        await catalog.UpsertProviderTeamsAsync(
            "RO",
            [new ExternalFootballTeam(externalTeamId, "Provider Team Changed", "NEW", 2020, true, "new-logo")],
            Ct);

        var refreshed = await db.Teams.AsNoTracking().SingleAsync(
            item => item.ExternalTeamId == externalTeamId,
            Ct);
        Assert.Equal("Admin Team", refreshed.Name);
        Assert.Equal(ReferenceDataSource.AdminCurated, refreshed.Source);
        Assert.Equal("NEW", refreshed.Code);
        Assert.True(refreshed.IsNational);
        Assert.Equal("new-logo", refreshed.LogoUrl);
    }

    [Fact]
    public async Task Team_search_endpoint_honors_requires_external_id_filter()
    {
        var pendingName = $"Pending Only {Guid.NewGuid():N}";
        var (userId, token) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(
            _fixture.Factory,
            Ct);

        using (var scope = _fixture.Factory.Services.CreateScope())
        {
            var catalog = scope.ServiceProvider.GetRequiredService<IReferenceDataCatalog>();
            await catalog.UpsertProviderTeamsAsync(
                "RO",
                [new ExternalFootballTeam(9_935_001, pendingName, "PND", null, false, null)],
                Ct);
            await catalog.TrySubmitTeamAsync("RO", pendingName, userId, 5, Ct);
        }

        using var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(
            _fixture.Factory,
            token);

        using var allResponse = await client.PostAsJsonAsync(
            "/api/reference-data/football/teams/search",
            new { country = "Romania", searchTerm = pendingName, requiresExternalId = false },
            Ct);
        allResponse.EnsureSuccessStatusCode();
        var all = await allResponse.Content.ReadFromJsonAsync<TeamResult>(Ct);
        Assert.True(all!.Teams.Count >= 2);

        using var filteredResponse = await client.PostAsJsonAsync(
            "/api/reference-data/football/teams/search",
            new { country = "Romania", searchTerm = pendingName, requiresExternalId = true },
            Ct);
        filteredResponse.EnsureSuccessStatusCode();
        var filtered = await filteredResponse.Content.ReadFromJsonAsync<TeamResult>(Ct);
        Assert.All(filtered!.Teams, team => Assert.NotNull(team.ExternalTeamId));
        Assert.DoesNotContain(filtered.Teams, team => team.Name == pendingName && team.ExternalTeamId is null);
    }

    [Fact]
    public async Task Provider_refresh_preserves_admin_fields_and_updates_neutral_metadata()
    {
        using var scope = _fixture.Factory.Services.CreateScope();
        var catalog = scope.ServiceProvider.GetRequiredService<IReferenceDataCatalog>();
        var db = scope.ServiceProvider.GetRequiredService<GlobalScoutDbContext>();
        const int externalCompetitionId = 9_910_001;

        await catalog.UpsertProviderCompetitionsAsync(
            "RO",
            [new ExternalFootballCompetition(externalCompetitionId, "Provider Name", "League", "old-logo")],
            Ct);

        var competition = await db.Competitions.SingleAsync(
            item => item.ExternalCompetitionId == externalCompetitionId,
            Ct);
        competition.Name = "Admin Name";
        competition.NameNormalized = "admin name";
        competition.Level = CompetitionLevel.Amateur;
        competition.Source = ReferenceDataSource.AdminCurated;
        await db.SaveChangesAsync(Ct);
        db.ChangeTracker.Clear();

        await catalog.UpsertProviderCompetitionsAsync(
            "RO",
            [new ExternalFootballCompetition(externalCompetitionId, "Provider Name Changed", "Cup", "new-logo")],
            Ct);

        var refreshed = await db.Competitions.AsNoTracking().SingleAsync(
            item => item.ExternalCompetitionId == externalCompetitionId,
            Ct);
        Assert.Equal("Admin Name", refreshed.Name);
        Assert.Equal(CompetitionLevel.Amateur, refreshed.Level);
        Assert.Equal(ReferenceDataSource.AdminCurated, refreshed.Source);
        Assert.Equal("Cup", refreshed.Type);
        Assert.Equal("new-logo", refreshed.LogoUrl);
    }

    [Fact]
    public async Task League_list_and_search_endpoints_read_from_the_catalog()
    {
        Guid competitionId;
        using (var scope = _fixture.Factory.Services.CreateScope())
        {
            var catalog = scope.ServiceProvider.GetRequiredService<IReferenceDataCatalog>();
            var upsert = await catalog.UpsertProviderCompetitionsAsync(
                "RO",
                [new ExternalFootballCompetition(9_920_001, "Endpoint Test League", "League", null)],
                Ct);
            competitionId = Assert.Single(upsert.Items).Id;
        }

        var (_, token) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(
            _fixture.Factory,
            Ct);
        using var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(
            _fixture.Factory,
            token);

        using var listResponse = await client.GetAsync(
            "/api/reference-data/football/competitions?country=Romania",
            Ct);
        listResponse.EnsureSuccessStatusCode();
        var list = await listResponse.Content.ReadFromJsonAsync<CompetitionResult>(Ct);
        Assert.Contains(list!.Competitions, competition => competition.Id == competitionId);

        using var searchResponse = await client.PostAsJsonAsync(
            "/api/reference-data/football/competitions/search",
            new { country = "Romania", searchTerm = "endpoint", level = (string?)null },
            Ct);
        searchResponse.EnsureSuccessStatusCode();
        var search = await searchResponse.Content.ReadFromJsonAsync<CompetitionResult>(Ct);
        Assert.Equal(competitionId, Assert.Single(search!.Competitions).Id);
    }

    [Fact]
    public async Task Pending_submission_limit_is_combined_across_teams_and_leagues()
    {
        var (userId, _) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(
            _fixture.Factory,
            Ct);

        using var scope = _fixture.Factory.Services.CreateScope();
        var catalog = scope.ServiceProvider.GetRequiredService<IReferenceDataCatalog>();
        for (var index = 1; index <= 3; index++)
        {
            var team = await catalog.TrySubmitTeamAsync(
                "RO",
                $"Pending Team {index}",
                userId,
                5,
                Ct);
            Assert.NotNull(team);
        }

        for (var index = 1; index <= 2; index++)
        {
            var competition = await catalog.TrySubmitCompetitionAsync(
                "RO",
                $"Pending League {index}",
                CompetitionLevel.Amateur,
                CompetitionType.League,
                userId,
                5,
                Ct);
            Assert.NotNull(competition);
            Assert.Equal(CompetitionLevel.Unknown, competition.Level);
            Assert.False(competition.IsVerified);
        }

        var rejected = await catalog.TrySubmitTeamAsync(
            "RO",
            "Sixth Pending Submission",
            userId,
            5,
            Ct);
        Assert.Null(rejected);
    }

    [Fact]
    public async Task Concurrent_submissions_cannot_bypass_the_limit()
    {
        var (userId, _) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(
            _fixture.Factory,
            Ct);

        async Task<FootballTeamDto?> SubmitAsync(string name)
        {
            using var scope = _fixture.Factory.Services.CreateScope();
            var catalog = scope.ServiceProvider.GetRequiredService<IReferenceDataCatalog>();
            return await catalog.TrySubmitTeamAsync("RO", name, userId, 1, Ct);
        }

        var submissions = await Task.WhenAll(
            SubmitAsync("Concurrent Team One"),
            SubmitAsync("Concurrent Team Two"));

        Assert.Single(submissions, submission => submission is not null);
        Assert.Single(submissions, submission => submission is null);
    }

    [Fact]
    public async Task Submission_endpoints_require_a_player_and_store_the_level_as_a_hint()
    {
        var (playerId, playerToken) =
            await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(_fixture.Factory, Ct);
        using var playerClient = SocialIntegrationTestHelpers.CreateAuthenticatedClient(
            _fixture.Factory,
            playerToken);

        using var response = await playerClient.PostAsJsonAsync(
            "/api/reference-data/football/competitions",
            new
            {
                country = "Romania",
                name = "Endpoint Submitted League",
                levelHint = "Amateur"
            },
            Ct);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var submitted = await response.Content.ReadFromJsonAsync<SubmittedLeague>(Ct);
        Assert.NotNull(submitted);
        Assert.Equal(nameof(CompetitionLevel.Unknown), submitted.Level);
        Assert.False(submitted.IsVerified);

        using (var scope = _fixture.Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<GlobalScoutDbContext>();
            var stored = await db.Competitions.AsNoTracking().SingleAsync(
                competition => competition.Id == submitted.Id,
                Ct);
            Assert.Equal(playerId, stored.SubmittedByUserId);
            Assert.Equal(CompetitionLevel.Amateur, stored.SubmittedLevelHint);
            Assert.Equal(CompetitionLevel.Unknown, stored.Level);
        }

        var (_, clubToken) = await _fixture.RegisterClubUserAsync(Ct);
        using var clubClient = SocialIntegrationTestHelpers.CreateAuthenticatedClient(
            _fixture.Factory,
            clubToken);
        using var forbidden = await clubClient.PostAsJsonAsync(
            "/api/reference-data/football/teams",
            new { country = "Romania", name = "Club Submitted Team" },
            Ct);
        Assert.Equal(HttpStatusCode.Forbidden, forbidden.StatusCode);
    }

    private sealed record CompetitionResult(IReadOnlyList<CompetitionItem> Competitions);

    private sealed record CompetitionItem(Guid Id);

    private sealed record TeamResult(IReadOnlyList<TeamItem> Teams);

    private sealed record TeamItem(string Name, int? ExternalTeamId);

    private sealed record SubmittedLeague(
        Guid Id,
        string Level,
        bool IsVerified);
}
