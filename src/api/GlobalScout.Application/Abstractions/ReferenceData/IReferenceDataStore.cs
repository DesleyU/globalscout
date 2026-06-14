namespace GlobalScout.Application.Abstractions.ReferenceData;

public interface IReferenceDataStore
{
    IReadOnlyList<FootballCountryDto> GetCountries();

    bool IsPreloadedCountry(string country);

    IReadOnlyList<FootballLeagueDto> GetLeagues(string country);

    IReadOnlyList<FootballTeamDto> SearchPreloadedTeams(string country, string searchTerm);
}
