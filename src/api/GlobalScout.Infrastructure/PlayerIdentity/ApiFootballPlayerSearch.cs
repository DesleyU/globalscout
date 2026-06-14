using System.Globalization;
using System.Text.Json;
using GlobalScout.Application.Abstractions.PlayerIdentity;
using GlobalScout.Application.Abstractions.Statistics;
using GlobalScout.Application.PlayerIdentity;
using GlobalScout.SharedKernel;
using Microsoft.Extensions.Options;

namespace GlobalScout.Infrastructure.PlayerIdentity;

internal sealed class ApiFootballPlayerSearch(
    HttpClient http,
    IOptions<ApiFootballOptions> options) : IExternalPlayerSearch
{
    private const int MaxCandidates = 20;

    public async Task<Result<IReadOnlyList<ExternalPlayerCandidate>>> SearchAsync(
        PlayerSearchCriteria criteria,
        CancellationToken cancellationToken)
    {
        var opt = options.Value;
        if (string.IsNullOrWhiteSpace(opt.ApiKey))
        {
            return Result.Failure<IReadOnlyList<ExternalPlayerCandidate>>(PlayerIdentityErrors.ExternalSearchUnavailable);
        }

        if (criteria.CurrentTeamId <= 0)
        {
            return Result.Success<IReadOnlyList<ExternalPlayerCandidate>>([]);
        }

        var searchTerm = criteria.LastName.Trim();
        if (searchTerm.Length < 3)
        {
            return Result.Success<IReadOnlyList<ExternalPlayerCandidate>>([]);
        }

        var encodedSearch = Uri.EscapeDataString(searchTerm);
        var teamId = criteria.CurrentTeamId.ToString(CultureInfo.InvariantCulture);

        using var playersResponse = await http.GetAsync(
            $"players?search={encodedSearch}&team={teamId}",
            cancellationToken);

        if (!playersResponse.IsSuccessStatusCode)
        {
            return Result.Failure<IReadOnlyList<ExternalPlayerCandidate>>(PlayerIdentityErrors.ExternalSearchUnavailable);
        }

        var playersJson = await playersResponse.Content.ReadAsStringAsync(cancellationToken);
        using var playersDoc = JsonDocument.Parse(playersJson);
        var candidates = ParsePlayersResponse(playersDoc, criteria.CurrentClub);

        return Result.Success<IReadOnlyList<ExternalPlayerCandidate>>(candidates);
    }

    private static List<ExternalPlayerCandidate> ParsePlayersResponse(
        JsonDocument doc,
        string selectedTeamName)
    {
        if (!doc.RootElement.TryGetProperty("response", out var response)
            || response.ValueKind != JsonValueKind.Array)
        {
            return [];
        }

        var candidates = new List<ExternalPlayerCandidate>();

        foreach (var item in response.EnumerateArray())
        {
            if (!item.TryGetProperty("player", out var player))
            {
                continue;
            }

            var mapped = MapPlayer(player, item, selectedTeamName);
            if (mapped is not null)
            {
                candidates.Add(mapped);
            }

            if (candidates.Count >= MaxCandidates)
            {
                break;
            }
        }

        return candidates;
    }

    private static ExternalPlayerCandidate? MapPlayer(
        JsonElement player,
        JsonElement statisticsItem,
        string selectedTeamName)
    {
        if (!player.TryGetProperty("id", out var idElement) || !idElement.TryGetInt32(out var externalPlayerId))
        {
            return null;
        }

        var firstName = ReadString(player, "firstname") ?? string.Empty;
        var lastName = ReadString(player, "lastname") ?? string.Empty;
        var name = !string.IsNullOrWhiteSpace(firstName) && !string.IsNullOrWhiteSpace(lastName)
            ? $"{firstName} {lastName}".Trim()
            : ReadString(player, "name") ?? string.Empty;

        if (string.IsNullOrWhiteSpace(name))
        {
            return null;
        }

        if (string.IsNullOrWhiteSpace(firstName))
        {
            firstName = ExtractFirstName(name);
        }

        if (string.IsNullOrWhiteSpace(lastName))
        {
            lastName = ExtractLastName(name);
        }

        string club = selectedTeamName;
        string position = string.Empty;
        string? league = null;

        if (statisticsItem.TryGetProperty("statistics", out var statistics)
            && statistics.ValueKind == JsonValueKind.Array
            && statistics.GetArrayLength() > 0)
        {
            var firstStats = statistics[0];
            club = ReadString(firstStats, "team", "name") ?? selectedTeamName;
            position = ReadString(firstStats, "games", "position") ?? string.Empty;
            league = ReadString(firstStats, "league", "name");
        }

        int? age = ReadNullableInt(player, "age");
        DateOnly? dateOfBirth = null;
        if (player.TryGetProperty("birth", out var birth)
            && birth.TryGetProperty("date", out var birthDate)
            && birthDate.ValueKind == JsonValueKind.String
            && DateOnly.TryParse(birthDate.GetString(), CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedDob))
        {
            dateOfBirth = parsedDob;
        }

        return new ExternalPlayerCandidate(
            externalPlayerId,
            ExternalPlayerProviders.ApiFootball,
            firstName,
            lastName,
            name,
            club,
            position,
            ReadString(player, "nationality") ?? string.Empty,
            age,
            dateOfBirth,
            ReadString(player, "photo"),
            PreviousClub: null,
            League: league);
    }

    private static string? ReadString(JsonElement element, string propertyName) =>
        element.TryGetProperty(propertyName, out var value) && value.ValueKind == JsonValueKind.String
            ? value.GetString()
            : null;

    private static string? ReadString(JsonElement element, string parentName, string propertyName) =>
        element.TryGetProperty(parentName, out var parent)
            ? ReadString(parent, propertyName)
            : null;

    private static int? ReadNullableInt(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out var value))
        {
            return null;
        }

        return value.ValueKind switch
        {
            JsonValueKind.Number when value.TryGetInt32(out var number) => number,
            JsonValueKind.String when int.TryParse(value.GetString(), NumberStyles.Integer, CultureInfo.InvariantCulture, out var parsed) => parsed,
            _ => null
        };
    }

    private static string ExtractFirstName(string fullName)
    {
        var parts = fullName.Trim()
            .Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries);

        return parts.Length switch
        {
            0 => string.Empty,
            1 => parts[0],
            _ => string.Join(' ', parts[..^1])
        };
    }

    private static string ExtractLastName(string fullName)
    {
        var parts = fullName.Trim()
            .Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries);

        return parts.Length switch
        {
            0 => string.Empty,
            _ => parts[^1]
        };
    }
}
