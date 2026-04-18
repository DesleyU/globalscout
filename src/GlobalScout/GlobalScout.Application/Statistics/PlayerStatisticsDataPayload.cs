using System.Text.Json;
using GlobalScout.Application.Abstractions.Persistence;

namespace GlobalScout.Application.Statistics;

/// <summary>Read/write canonical keys in <see cref="PlayerStatistics.Data"/>.</summary>
public static class PlayerStatisticsDataPayload
{
    public static JsonDocument CreateManualDocument(string season, ManualStatisticsValues v) =>
        JsonSerializer.SerializeToDocument(new Dictionary<string, JsonElement>
        {
            ["kind"] = JsonSerializer.SerializeToElement("manual"),
            ["season"] = JsonSerializer.SerializeToElement(season),
            ["goals"] = JsonSerializer.SerializeToElement(v.Goals),
            ["assists"] = JsonSerializer.SerializeToElement(v.Assists),
            ["matches"] = JsonSerializer.SerializeToElement(v.Matches),
            ["minutes"] = JsonSerializer.SerializeToElement(v.Minutes),
            ["yellowCards"] = JsonSerializer.SerializeToElement(v.YellowCards),
            ["redCards"] = JsonSerializer.SerializeToElement(v.RedCards),
            ["rating"] = JsonSerializer.SerializeToElement(v.Rating),
            ["shotsTotal"] = JsonSerializer.SerializeToElement(v.ShotsTotal),
            ["shotsOnTarget"] = JsonSerializer.SerializeToElement(v.ShotsOnTarget),
            ["passesTotal"] = JsonSerializer.SerializeToElement(v.PassesTotal),
            ["passesAccuracy"] = JsonSerializer.SerializeToElement(v.PassesAccuracy),
            ["tacklesTotal"] = JsonSerializer.SerializeToElement(v.TacklesTotal),
            ["tacklesInterceptions"] = JsonSerializer.SerializeToElement(v.TacklesInterceptions),
            ["duelsWon"] = JsonSerializer.SerializeToElement(v.DuelsWon),
            ["foulsCommitted"] = JsonSerializer.SerializeToElement(v.FoulsCommitted),
            ["foulsDrawn"] = JsonSerializer.SerializeToElement(v.FoulsDrawn)
        });

    /// <summary>Parse values for merge when updating a manual row (flat keys or legacy column-only backfill).</summary>
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
            FoulsDrawn = ReadNullableInt(stats, "foulsDrawn", "fouls_drawn")
        };
    }

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
