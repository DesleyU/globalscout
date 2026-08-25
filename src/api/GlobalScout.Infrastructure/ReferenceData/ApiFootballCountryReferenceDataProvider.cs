using System.Text.Json;
using GlobalScout.Application.Abstractions.ReferenceData;
using GlobalScout.Application.Abstractions.Statistics;
using GlobalScout.Application.ReferenceData;
using GlobalScout.SharedKernel;
using Microsoft.Extensions.Options;

namespace GlobalScout.Infrastructure.ReferenceData;

internal sealed class ApiFootballCountryReferenceDataProvider(
    HttpClient http,
    IOptions<ApiFootballOptions> options) : IExternalCountryReferenceDataProvider
{
    private const int MaxPages = 250;

    public Task<Result<IReadOnlyList<ExternalFootballTeam>>> GetTeamsAsync(
        string providerCountryName,
        CancellationToken cancellationToken) =>
        GetAllPagesAsync(
            $"teams?country={Uri.EscapeDataString(providerCountryName.Trim())}",
            ParseTeams,
            cancellationToken);

    public Task<Result<IReadOnlyList<ExternalFootballCompetition>>> GetLeaguesAsync(
        string providerCountryName,
        CancellationToken cancellationToken) =>
        GetAllPagesAsync(
            $"leagues?country={Uri.EscapeDataString(providerCountryName.Trim())}",
            ParseLeagues,
            cancellationToken);

    private async Task<Result<IReadOnlyList<T>>> GetAllPagesAsync<T>(
        string requestPath,
        Func<JsonElement, IReadOnlyList<T>> parseItems,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(options.Value.ApiKey))
        {
            return Result.Failure<IReadOnlyList<T>>(ReferenceDataErrors.ExternalCountrySyncUnavailable);
        }

        var items = new List<T>();
        var page = 1;
        var totalPages = 1;

        do
        {
            try
            {
                var pagePath = page == 1
                    ? requestPath
                    : $"{requestPath}&page={page}";
                using var response = await http.GetAsync(
                    pagePath,
                    cancellationToken);
                if (!response.IsSuccessStatusCode)
                {
                    return Result.Failure<IReadOnlyList<T>>(
                        ReferenceDataErrors.ExternalCountrySyncUnavailable);
                }

                await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
                using var document = await JsonDocument.ParseAsync(
                    stream,
                    cancellationToken: cancellationToken);
                if (HasProviderErrors(document.RootElement)
                    || !document.RootElement.TryGetProperty("response", out var responseItems)
                    || responseItems.ValueKind != JsonValueKind.Array)
                {
                    return Result.Failure<IReadOnlyList<T>>(
                        ReferenceDataErrors.ExternalCountrySyncUnavailable);
                }

                items.AddRange(parseItems(responseItems));
                totalPages = ReadTotalPages(document.RootElement);
                if (totalPages > MaxPages)
                {
                    return Result.Failure<IReadOnlyList<T>>(
                        ReferenceDataErrors.ExternalCountrySyncUnavailable);
                }
            }
            catch (HttpRequestException)
            {
                return Result.Failure<IReadOnlyList<T>>(
                    ReferenceDataErrors.ExternalCountrySyncUnavailable);
            }
            catch (JsonException)
            {
                return Result.Failure<IReadOnlyList<T>>(
                    ReferenceDataErrors.ExternalCountrySyncUnavailable);
            }

            page++;
        }
        while (page <= totalPages);

        return Result.Success<IReadOnlyList<T>>(items);
    }

    private static IReadOnlyList<ExternalFootballTeam> ParseTeams(JsonElement response)
    {
        var teams = new List<ExternalFootballTeam>();
        foreach (var item in response.EnumerateArray())
        {
            if (!item.TryGetProperty("team", out var team)
                || !team.TryGetProperty("id", out var idElement)
                || !idElement.TryGetInt32(out var id))
            {
                continue;
            }

            var name = ReadString(team, "name");
            if (string.IsNullOrWhiteSpace(name))
            {
                continue;
            }

            int? founded = null;
            if (team.TryGetProperty("founded", out var foundedElement)
                && foundedElement.ValueKind == JsonValueKind.Number
                && foundedElement.TryGetInt32(out var foundedYear))
            {
                founded = foundedYear;
            }

            teams.Add(new ExternalFootballTeam(
                id,
                name,
                ReadString(team, "code"),
                founded,
                team.TryGetProperty("national", out var national)
                    && national.ValueKind == JsonValueKind.True,
                ReadString(team, "logo")));
        }

        return teams;
    }

    private static IReadOnlyList<ExternalFootballCompetition> ParseLeagues(JsonElement response)
    {
        var competitions = new List<ExternalFootballCompetition>();
        foreach (var item in response.EnumerateArray())
        {
            if (!item.TryGetProperty("league", out var league)
                || !league.TryGetProperty("id", out var idElement)
                || !idElement.TryGetInt32(out var id))
            {
                continue;
            }

            var name = ReadString(league, "name");
            if (string.IsNullOrWhiteSpace(name))
            {
                continue;
            }

            competitions.Add(new ExternalFootballCompetition(
                id,
                name,
                ReadString(league, "type"),
                ReadString(league, "logo")));
        }

        return competitions;
    }

    private static int ReadTotalPages(JsonElement root)
    {
        if (root.TryGetProperty("paging", out var paging)
            && paging.TryGetProperty("total", out var total)
            && total.TryGetInt32(out var value)
            && value > 0)
        {
            return value;
        }

        return 1;
    }

    private static bool HasProviderErrors(JsonElement root)
    {
        if (!root.TryGetProperty("errors", out var errors))
        {
            return false;
        }

        return errors.ValueKind switch
        {
            JsonValueKind.Array => errors.GetArrayLength() > 0,
            JsonValueKind.Object => errors.EnumerateObject().Any(),
            JsonValueKind.String => !string.IsNullOrWhiteSpace(errors.GetString()),
            _ => false
        };
    }

    private static string? ReadString(JsonElement element, string propertyName) =>
        element.TryGetProperty(propertyName, out var value)
        && value.ValueKind == JsonValueKind.String
            ? value.GetString()
            : null;
}
