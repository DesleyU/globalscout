using GlobalScout.Application.Abstractions.ReferenceData;
using GlobalScout.Application.ReferenceData.SearchTeams;
using GlobalScout.SharedKernel;
using Xunit;

namespace GlobalScout.Application.UnitTests.ReferenceData;

public sealed class SearchFootballTeamsQueryHandlerTests
{
    [Fact]
    public async Task Handle_returns_preloaded_teams_without_calling_external_search()
    {
        var store = new FakeReferenceDataStore(preloadedCountries: ["Romania"]);
        store.SetPreloadedTeams(
            "Romania",
            [new FootballTeamDto(559, "FCSB", "STE", "Romania", 1947, false, null)]);

        var external = new FakeExternalTeamSearch();
        var handler = new SearchFootballTeamsQueryHandler(store, external);

        var result = await handler.Handle(
            new SearchFootballTeamsQuery("Romania", "fcs"),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Single(result.Value.Teams);
        Assert.Equal(559, result.Value.Teams[0].ExternalTeamId);
        Assert.False(external.WasCalled);
    }

    [Fact]
    public async Task Handle_falls_back_to_external_search_for_non_preloaded_country()
    {
        var store = new FakeReferenceDataStore();
        var external = new FakeExternalTeamSearch();
        external.SetResults(
            [new FootballTeamDto(123, "Test FC", "TST", "Albania", null, false, null)]);

        var handler = new SearchFootballTeamsQueryHandler(store, external);

        var result = await handler.Handle(
            new SearchFootballTeamsQuery("Albania", "test"),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Single(result.Value.Teams);
        Assert.True(external.WasCalled);
    }

    private sealed class FakeReferenceDataStore : IReferenceDataStore
    {
        private readonly HashSet<string> _preloadedCountries;
        private readonly Dictionary<string, IReadOnlyList<FootballTeamDto>> _teams = new(StringComparer.OrdinalIgnoreCase);

        public FakeReferenceDataStore(IEnumerable<string>? preloadedCountries = null)
        {
            _preloadedCountries = new HashSet<string>(
                preloadedCountries ?? [],
                StringComparer.OrdinalIgnoreCase);
        }

        public void SetPreloadedTeams(string country, IReadOnlyList<FootballTeamDto> teams) =>
            _teams[country] = teams;

        public IReadOnlyList<FootballCountryDto> GetCountries() => [];

        public bool IsPreloadedCountry(string country) =>
            _preloadedCountries.Contains(country.Trim());

        public IReadOnlyList<FootballLeagueDto> GetLeagues(string country) => [];

        public IReadOnlyList<FootballTeamDto> SearchPreloadedTeams(string country, string searchTerm)
        {
            if (!_teams.TryGetValue(country.Trim(), out var teams))
            {
                return [];
            }

            return teams
                .Where(team => team.Name.Contains(searchTerm.Trim(), StringComparison.OrdinalIgnoreCase))
                .ToArray();
        }
    }

    private sealed class FakeExternalTeamSearch : IExternalTeamSearch
    {
        private IReadOnlyList<FootballTeamDto> _results = [];

        public bool WasCalled { get; private set; }

        public void SetResults(IReadOnlyList<FootballTeamDto> results) => _results = results;

        public Task<Result<IReadOnlyList<FootballTeamDto>>> SearchAsync(
            string country,
            string searchTerm,
            CancellationToken cancellationToken)
        {
            WasCalled = true;
            return Task.FromResult(Result.Success(_results));
        }
    }
}
