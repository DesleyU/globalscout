using System.Text.Json;
using System.Text.Json.Serialization;
using GlobalScout.Application.Abstractions.ReferenceData;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace GlobalScout.Infrastructure.ReferenceData;

internal sealed class JsonReferenceDataStore : IReferenceDataStore
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private readonly IReadOnlyList<FootballCountryDto> _countries;
    private readonly IReadOnlyDictionary<string, PreloadedCountryData> _preloadedByCountry;

    public JsonReferenceDataStore(
        IOptions<ReferenceDataOptions> options,
        ILogger<JsonReferenceDataStore> logger)
    {
        var configuredPreloaded = options.Value.PreloadedCountries
            .Where(c => !string.IsNullOrWhiteSpace(c))
            .Select(c => c.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        var dataRoot = ResolveDataRoot();
        var countriesFile = Path.Combine(dataRoot, "countries.json");
        var rawCountries = LoadJsonFile<CountryFileRecord[]>(countriesFile, logger, "countries") ?? [];
        var preloadedLookup = new Dictionary<string, PreloadedCountryData>(StringComparer.OrdinalIgnoreCase);

        foreach (var countryName in configuredPreloaded)
        {
            var slug = ToCountrySlug(countryName);
            var preloadedFile = Path.Combine(dataRoot, "Preloaded", $"{slug}.json");
            if (!File.Exists(preloadedFile))
            {
                logger.LogWarning(
                    "Preloaded reference data file missing for country {Country} at {Path}",
                    countryName,
                    preloadedFile);
                continue;
            }

            var preloaded = LoadJsonFile<PreloadedCountryFile>(preloadedFile, logger, $"preloaded:{countryName}");
            if (preloaded is null)
            {
                continue;
            }

            preloadedLookup[countryName] = MapPreloadedCountry(preloaded);
        }

        _preloadedByCountry = preloadedLookup;
        _countries = rawCountries
            .Select(country =>
            {
                var isPreloaded = preloadedLookup.ContainsKey(country.Name);
                return new FootballCountryDto(country.Name, country.Code, country.FlagUrl, isPreloaded);
            })
            .OrderBy(c => c.Name, StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }

    public IReadOnlyList<FootballCountryDto> GetCountries() => _countries;

    public bool IsPreloadedCountry(string country) =>
        !string.IsNullOrWhiteSpace(country)
        && _preloadedByCountry.ContainsKey(country.Trim());

    public IReadOnlyList<FootballLeagueDto> GetLeagues(string country)
    {
        if (!TryGetPreloaded(country, out var preloaded))
        {
            return [];
        }

        return preloaded.Leagues;
    }

    public IReadOnlyList<FootballTeamDto> SearchPreloadedTeams(string country, string searchTerm)
    {
        if (!TryGetPreloaded(country, out var preloaded))
        {
            return [];
        }

        var term = searchTerm.Trim();
        if (term.Length < 2)
        {
            return [];
        }

        return preloaded.Teams
            .Where(team => team.Name.Contains(term, StringComparison.OrdinalIgnoreCase))
            .OrderBy(team => team.Name, StringComparer.OrdinalIgnoreCase)
            .Take(25)
            .ToArray();
    }

    private bool TryGetPreloaded(string country, out PreloadedCountryData data)
    {
        data = default!;
        return !string.IsNullOrWhiteSpace(country)
               && _preloadedByCountry.TryGetValue(country.Trim(), out data!);
    }

    private static PreloadedCountryData MapPreloadedCountry(PreloadedCountryFile file)
    {
        var country = file.Country.Trim();
        var leagues = file.Leagues
            .Select(league => new FootballLeagueDto(
                league.ExternalLeagueId,
                league.Name,
                country,
                league.Type,
                league.LogoUrl))
            .ToArray();

        var teams = file.Teams
            .Select(team => new FootballTeamDto(
                team.Id,
                team.Name,
                team.Code,
                string.IsNullOrWhiteSpace(team.Country) ? country : team.Country.Trim(),
                team.Founded,
                team.National,
                team.Logo))
            .ToArray();

        return new PreloadedCountryData(leagues, teams);
    }

    private static string ResolveDataRoot()
    {
        var assemblyDir = Path.GetDirectoryName(typeof(JsonReferenceDataStore).Assembly.Location)
                          ?? AppContext.BaseDirectory;
        return Path.Combine(assemblyDir, "ReferenceData", "Data");
    }

    private static string ToCountrySlug(string country) =>
        country.Trim().ToLowerInvariant().Replace(' ', '-');

    private static T? LoadJsonFile<T>(string path, ILogger logger, string label)
    {
        if (!File.Exists(path))
        {
            logger.LogError("Reference data file not found for {Label} at {Path}", label, path);
            return default;
        }

        try
        {
            var json = File.ReadAllText(path);
            return JsonSerializer.Deserialize<T>(json, JsonOptions);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to load reference data for {Label} from {Path}", label, path);
            return default;
        }
    }

    private sealed record PreloadedCountryData(
        IReadOnlyList<FootballLeagueDto> Leagues,
        IReadOnlyList<FootballTeamDto> Teams);

    private sealed record CountryFileRecord(string Name, string? Code, string? FlagUrl);

    private sealed record PreloadedCountryFile(
        string Country,
        IReadOnlyList<LeagueFileRecord> Leagues,
        IReadOnlyList<TeamFileRecord> Teams);

    private sealed record LeagueFileRecord(
        int ExternalLeagueId,
        string Name,
        string? Type,
        string? LogoUrl);

    private sealed record TeamFileRecord(
        [property: JsonPropertyName("id")] int Id,
        string Name,
        string? Code,
        string? Country,
        int? Founded,
        bool National,
        [property: JsonPropertyName("logo")] string? Logo);
}
