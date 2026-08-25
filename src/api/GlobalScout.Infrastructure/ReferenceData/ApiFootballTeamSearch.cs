using System.Text.Json;
using System.Text.Json.Serialization;
using GlobalScout.Application.Abstractions.ReferenceData;
using GlobalScout.Application.Abstractions.Statistics;
using GlobalScout.Application.Common;
using GlobalScout.Application.ReferenceData;
using GlobalScout.SharedKernel;
using Microsoft.Extensions.Options;

namespace GlobalScout.Infrastructure.ReferenceData;

internal sealed class ApiFootballTeamSearch(
    HttpClient http,
    IOptions<ApiFootballOptions> options) : IExternalTeamSearch
{
    private const int MaxTeams = 25;

    public async Task<Result<IReadOnlyList<ExternalFootballTeam>>> SearchAsync(
        string country,
        string searchTerm,
        CancellationToken cancellationToken)
    {
        var opt = options.Value;
        if (string.IsNullOrWhiteSpace(opt.ApiKey))
        {
            return Result.Failure<IReadOnlyList<ExternalFootballTeam>>(
                ReferenceDataErrors.ExternalTeamSearchUnavailable);
        }

        var trimmedCountry = country.Trim();
        var trimmedSearch = TextNormalizer.ToApiFootballSearchTerm(searchTerm);
        if (trimmedSearch.Length < 3)
        {
            return Result.Success<IReadOnlyList<ExternalFootballTeam>>([]);
        }

        var encodedCountry = Uri.EscapeDataString(trimmedCountry);
        var encodedSearch = Uri.EscapeDataString(trimmedSearch);

        using var response = await http.GetAsync(
            $"teams?search={encodedSearch}&country={encodedCountry}",
            cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            return Result.Failure<IReadOnlyList<ExternalFootballTeam>>(
                ReferenceDataErrors.ExternalTeamSearchUnavailable);
        }

        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        using var doc = JsonDocument.Parse(json);
        var teams = ParseTeamsResponse(doc);

        return Result.Success<IReadOnlyList<ExternalFootballTeam>>(teams);
    }

    private static List<ExternalFootballTeam> ParseTeamsResponse(JsonDocument doc)
    {
        if (!doc.RootElement.TryGetProperty("response", out var response)
            || response.ValueKind != JsonValueKind.Array)
        {
            return [];
        }

        var teams = new List<ExternalFootballTeam>();

        foreach (var item in response.EnumerateArray())
        {
            if (!item.TryGetProperty("team", out var teamElement))
            {
                continue;
            }

            var mapped = MapTeam(teamElement);
            if (mapped is not null)
            {
                teams.Add(mapped);
            }

            if (teams.Count >= MaxTeams)
            {
                break;
            }
        }

        return teams;
    }

    private static ExternalFootballTeam? MapTeam(JsonElement team)
    {
        if (!team.TryGetProperty("id", out var idElement) || !idElement.TryGetInt32(out var id))
        {
            return null;
        }

        var name = ReadString(team, "name");
        if (string.IsNullOrWhiteSpace(name))
        {
            return null;
        }

        int? founded = null;
        if (team.TryGetProperty("founded", out var foundedElement)
            && foundedElement.ValueKind == JsonValueKind.Number
            && foundedElement.TryGetInt32(out var foundedYear))
        {
            founded = foundedYear;
        }

        var national = team.TryGetProperty("national", out var nationalElement)
                       && nationalElement.ValueKind == JsonValueKind.True;

        return new ExternalFootballTeam(
            id,
            name,
            ReadString(team, "code"),
            founded,
            national,
            ReadString(team, "logo"));
    }

    private static string? ReadString(JsonElement element, string propertyName) =>
        element.TryGetProperty(propertyName, out var value) && value.ValueKind == JsonValueKind.String
            ? value.GetString()
            : null;
}
