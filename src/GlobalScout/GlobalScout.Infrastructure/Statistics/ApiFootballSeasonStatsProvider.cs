using System.Globalization;
using System.Text.Json;
using GlobalScout.Application.Abstractions.Statistics;
using GlobalScout.Application.Statistics;
using GlobalScout.SharedKernel;
using Microsoft.Extensions.Options;

namespace GlobalScout.Infrastructure.Statistics;

internal sealed class ApiFootballSeasonStatsProvider(
    HttpClient http,
    IOptions<ApiFootballOptions> options) : IApiFootballSeasonStatsProvider
{
    public async Task<Result<AggregatedFootballSeasonStats>> GetAggregatedAsync(
        int apiPlayerId,
        int seasonYear,
        CancellationToken cancellationToken)
    {
        var opt = options.Value;
        if (string.IsNullOrWhiteSpace(opt.ApiKey))
        {
            return Result.Failure<AggregatedFootballSeasonStats>(StatsErrors.ApiFootballNotConfigured);
        }

        using var response = await http.GetAsync(
            $"players?id={apiPlayerId.ToString(CultureInfo.InvariantCulture)}&season={seasonYear.ToString(CultureInfo.InvariantCulture)}",
            cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            return Result.Failure<AggregatedFootballSeasonStats>(StatsErrors.ExternalStatsUnavailable);
        }

        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        using var doc = JsonDocument.Parse(json);
        return Parse(doc, seasonYear);
    }

    private static Result<AggregatedFootballSeasonStats> Parse(JsonDocument doc, int seasonYear)
    {
        if (!doc.RootElement.TryGetProperty("response", out var responseEl)
            || responseEl.ValueKind != JsonValueKind.Array
            || responseEl.GetArrayLength() == 0)
        {
            return Result.Failure<AggregatedFootballSeasonStats>(StatsErrors.ExternalStatsUnavailable);
        }

        var first = responseEl[0];
        if (!first.TryGetProperty("statistics", out var statistics) || statistics.ValueKind != JsonValueKind.Array)
        {
            return Result.Failure<AggregatedFootballSeasonStats>(StatsErrors.ExternalStatsUnavailable);
        }

        var goals = 0;
        var assists = 0;
        var appearances = 0;
        var minutes = 0;
        var yellow = 0;
        var red = 0;
        double ratingSum = 0;
        var ratingWeight = 0;
        var shotsTot = 0;
        var shotsOnT = 0;
        var passesTot = 0;
        double? passesAccSum = null;
        var passesAccN = 0;
        var tacklesTot = 0;
        var tacklesInt = 0;
        var duelsW = 0;
        var foulsComm = 0;
        var foulsDr = 0;

        foreach (var stat in statistics.EnumerateArray())
        {
            if (stat.TryGetProperty("goals", out var g))
            {
                goals += ReadInt(g, "total");
                assists += ReadInt(g, "assists");
            }

            if (stat.TryGetProperty("games", out var games))
            {
                appearances += ReadInt(games, "appearences");
                if (games.TryGetProperty("appearences", out _))
                {
                    // API typo appearences already handled
                }

                minutes += ReadInt(games, "minutes");
                if (games.TryGetProperty("rating", out var ratEl) && ratEl.ValueKind == JsonValueKind.String)
                {
                    if (double.TryParse(ratEl.GetString(), CultureInfo.InvariantCulture, out var rv))
                    {
                        var apps = ReadInt(games, "appearences");
                        var w = apps > 0 ? apps : 1;
                        ratingSum += rv * w;
                        ratingWeight += w;
                    }
                }
            }

            if (stat.TryGetProperty("cards", out var cards))
            {
                yellow += ReadInt(cards, "yellow");
                red += ReadInt(cards, "red");
            }

            if (stat.TryGetProperty("shots", out var shots))
            {
                shotsTot += ReadInt(shots, "total");
                shotsOnT += ReadInt(shots, "on");
            }

            if (stat.TryGetProperty("passes", out var passes))
            {
                passesTot += ReadInt(passes, "total");
                if (passes.TryGetProperty("accuracy", out var acc))
                {
                    if (acc.ValueKind == JsonValueKind.Number && acc.TryGetInt32(out var accI))
                    {
                        passesAccSum = (passesAccSum ?? 0) + accI;
                        passesAccN++;
                    }
                    else if (acc.ValueKind == JsonValueKind.String && int.TryParse(acc.GetString(), out var accP))
                    {
                        passesAccSum = (passesAccSum ?? 0) + accP;
                        passesAccN++;
                    }
                }
            }

            if (stat.TryGetProperty("tackles", out var tackles))
            {
                tacklesTot += ReadInt(tackles, "total");
                tacklesInt += ReadInt(tackles, "interceptions");
            }

            if (stat.TryGetProperty("duels", out var duels))
            {
                duelsW += ReadInt(duels, "won");
            }

            if (stat.TryGetProperty("fouls", out var fouls))
            {
                foulsComm += ReadInt(fouls, "committed");
                foulsDr += ReadInt(fouls, "drawn");
            }
        }

        double? rating = ratingWeight > 0 ? ratingSum / ratingWeight : null;
        double? passesAccuracy = passesAccN > 0 ? passesAccSum / passesAccN : null;

        var detail = JsonSerializer.SerializeToDocument(
            new
            {
                seasonYear,
                provider = StatsSource.ApiFootball,
                aggregated = new
                {
                    goals,
                    assists,
                    appearances,
                    minutes,
                    yellowCards = yellow,
                    redCards = red,
                    rating,
                    shotsTotal = shotsTot,
                    shotsOnTarget = shotsOnT,
                    passesTotal = passesTot,
                    passesAccuracy,
                    tacklesTotal = tacklesTot,
                    tacklesInterceptions = tacklesInt,
                    duelsWon = duelsW,
                    foulsCommitted = foulsComm,
                    foulsDrawn = foulsDr
                }
            });

        return Result.Success(
            new AggregatedFootballSeasonStats(
                seasonYear,
                goals,
                assists,
                appearances,
                minutes,
                yellow,
                red,
                rating,
                NullIfZero(shotsTot),
                NullIfZero(shotsOnT),
                NullIfZero(passesTot),
                passesAccuracy,
                NullIfZero(tacklesTot),
                NullIfZero(tacklesInt),
                NullIfZero(duelsW),
                NullIfZero(foulsComm),
                NullIfZero(foulsDr),
                detail));
    }

    private static int? NullIfZero(int v) => v > 0 ? v : null;

    private static int ReadInt(JsonElement parent, string name)
    {
        if (!parent.TryGetProperty(name, out var el))
        {
            return 0;
        }

        return el.ValueKind switch
        {
            JsonValueKind.Number when el.TryGetInt32(out var i) => i,
            JsonValueKind.String when int.TryParse(el.GetString(), out var p) => p,
            _ => 0
        };
    }
}
