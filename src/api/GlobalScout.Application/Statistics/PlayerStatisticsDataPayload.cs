using System.Globalization;
using System.Text.Json;
using GlobalScout.Application.Abstractions.Persistence;

namespace GlobalScout.Application.Statistics;

/// <summary>Read/write canonical keys in <see cref="PlayerStatistics.Data"/>.</summary>
public static class PlayerStatisticsDataPayload
{
    public const string ManualSchemaVersion = "manual-v2";

    public static JsonDocument CreateManualDocument(string season, ManualStatisticsValues v)
    {
        var competitions = v.Competitions
            .Select(ToCompetitionElement)
            .ToArray();

        var payload = new Dictionary<string, object?>
        {
            ["kind"] = "manual",
            ["season"] = season,
            ["aggregated"] = new Dictionary<string, object?>
            {
                ["goals"] = v.Goals,
                ["assists"] = v.Assists,
                ["appearances"] = v.Matches,
                ["minutes"] = v.Minutes,
                ["yellowCards"] = v.YellowCards,
                ["redCards"] = v.RedCards,
                ["rating"] = v.Rating,
                ["shotsTotal"] = v.ShotsTotal,
                ["shotsOnTarget"] = v.ShotsOnTarget,
                ["passesTotal"] = v.PassesTotal,
                ["passesAccuracy"] = v.PassesAccuracy,
                ["tacklesTotal"] = v.TacklesTotal,
                ["tacklesInterceptions"] = v.TacklesInterceptions,
                ["duelsWon"] = v.DuelsWon,
                ["foulsCommitted"] = v.FoulsCommitted,
                ["foulsDrawn"] = v.FoulsDrawn,
            },
            ["competitions"] = competitions,
        };

        return JsonSerializer.SerializeToDocument(payload);
    }

    /// <summary>Parse values for merge when updating a manual row (flat keys or nested aggregated).</summary>
    public static ManualStatisticsValues ParseManualForMerge(JsonDocument? data)
    {
        if (data is null)
        {
            return new ManualStatisticsValues();
        }

        var root = data.RootElement;
        var stats = root;
        if (root.TryGetProperty("aggregated", out var agg))
        {
            stats = agg;
        }

        return new ManualStatisticsValues
        {
            Goals = ReadInt(stats, "goals"),
            Assists = ReadInt(stats, "assists"),
            Matches = ReadInt(stats, "matches", "appearances"),
            Minutes = ReadInt(stats, "minutes"),
            YellowCards = ReadInt(stats, "yellowCards", "yellow_cards"),
            RedCards = ReadInt(stats, "redCards", "red_cards"),
            Rating = ReadDouble(stats, "rating"),
            ShotsTotal = ReadNullableInt(stats, "shotsTotal", "shots_total"),
            ShotsOnTarget = ReadNullableInt(stats, "shotsOnTarget", "shots_on_target"),
            PassesTotal = ReadNullableInt(stats, "passesTotal", "passes_total"),
            PassesAccuracy = ReadNullableDouble(stats, "passesAccuracy", "passes_accuracy"),
            TacklesTotal = ReadNullableInt(stats, "tacklesTotal", "tackles_total"),
            TacklesInterceptions = ReadNullableInt(stats, "tacklesInterceptions", "tackles_interceptions"),
            DuelsWon = ReadNullableInt(stats, "duelsWon", "duels_won"),
            FoulsCommitted = ReadNullableInt(stats, "foulsCommitted", "fouls_committed"),
            FoulsDrawn = ReadNullableInt(stats, "foulsDrawn", "fouls_drawn"),
            Competitions = [],
        };
    }

    private static object ToCompetitionElement(ResolvedManualCompetition row) =>
        new Dictionary<string, object?>
        {
            ["team"] = new Dictionary<string, object?>
            {
                ["id"] = row.TeamExternalId,
                ["name"] = row.TeamName,
                ["catalogId"] = row.TeamCatalogId,
                ["isVerified"] = row.TeamIsVerified,
            },
            ["competition"] = new Dictionary<string, object?>
            {
                ["id"] = row.CompetitionExternalId,
                ["name"] = row.CompetitionName,
                ["country"] = row.CompetitionCountry,
                ["season"] = row.SeasonYear,
                ["catalogId"] = row.CompetitionCatalogId,
                ["level"] = row.Level,
                ["isVerified"] = row.CompetitionIsVerified,
            },
            ["games"] = new Dictionary<string, object?>
            {
                ["appearences"] = row.Appearances,
                ["minutes"] = row.Minutes,
                ["rating"] = row.Rating?.ToString("0.##", CultureInfo.InvariantCulture),
            },
            ["goals"] = new Dictionary<string, object?>
            {
                ["total"] = row.Goals,
                ["assists"] = row.Assists,
            },
            ["cards"] = new Dictionary<string, object?>
            {
                ["yellow"] = row.YellowCards,
                ["red"] = row.RedCards,
            },
        };

    private static int ReadInt(JsonElement el, params string[] names)
    {
        foreach (var name in names)
        {
            if (el.TryGetProperty(name, out var p))
            {
                return CoerceInt(p);
            }
        }

        return 0;
    }

    private static int? ReadNullableInt(JsonElement el, params string[] names)
    {
        foreach (var name in names)
        {
            if (el.TryGetProperty(name, out var p))
            {
                if (p.ValueKind == JsonValueKind.Null)
                {
                    return null;
                }

                return CoerceInt(p);
            }
        }

        return null;
    }

    private static int CoerceInt(JsonElement p) =>
        p.ValueKind switch
        {
            JsonValueKind.Number when p.TryGetInt32(out var i) => i,
            JsonValueKind.String when int.TryParse(p.GetString(), out var s) => s,
            _ => 0
        };

    private static double? ReadDouble(JsonElement el, string name)
    {
        if (!el.TryGetProperty(name, out var p) || p.ValueKind == JsonValueKind.Null)
        {
            return null;
        }

        return p.ValueKind switch
        {
            JsonValueKind.Number when p.TryGetDouble(out var d) => d,
            JsonValueKind.String when double.TryParse(p.GetString(), out var s) => s,
            _ => null
        };
    }

    private static double? ReadNullableDouble(JsonElement el, params string[] names)
    {
        foreach (var name in names)
        {
            if (el.TryGetProperty(name, out var p))
            {
                if (p.ValueKind == JsonValueKind.Null)
                {
                    return null;
                }

                return p.ValueKind switch
                {
                    JsonValueKind.Number when p.TryGetDouble(out var d) => d,
                    JsonValueKind.String when double.TryParse(p.GetString(), out var s) => s,
                    _ => null
                };
            }
        }

        return null;
    }
}
