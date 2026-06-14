using System.Text.Json;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Domain.Users;

namespace GlobalScout.Application.Statistics;

internal static class PlayerStatisticsMapper
{
    public static PlayerStatisticsListItemDto ToDto(PlayerStatistics p)
    {
        JsonElement? dataEl = null;
        if (p.Data is not null)
        {
            dataEl = p.Data.RootElement.Clone();
        }

        return new PlayerStatisticsListItemDto(
            p.Id,
            p.Season,
            p.Source,
            p.SchemaVersion,
            dataEl);
    }

    private static ManualStatisticsValues ParseValues(PlayerStatisticsListItemDto row)
    {
        JsonDocument? doc = null;
        if (row.Data is JsonElement el)
        {
            doc = JsonDocument.Parse(el.GetRawText());
        }

        return PlayerStatisticsDataPayload.ParseManualForMerge(doc);
    }

    public static IReadOnlyDictionary<string, object?> ToBasicMaskedDictionary(PlayerStatisticsListItemDto row)
    {
        var v = ParseValues(row);
        return new Dictionary<string, object?>
        {
            ["id"] = row.Id,
            ["season"] = row.Season,
            ["source"] = row.Source,
            ["schemaVersion"] = row.SchemaVersion,
            ["goals"] = v.Goals,
            ["assists"] = v.Assists,
            ["minutes"] = v.Minutes,
            ["matches"] = v.Matches,
            ["appearances"] = v.Matches,
            ["yellowCards"] = v.YellowCards,
            ["redCards"] = v.RedCards,
            ["rating"] = v.Rating
        };
    }

    public static Dictionary<string, object?> ToFullDictionary(PlayerStatisticsListItemDto row)
    {
        var v = ParseValues(row);
        return new Dictionary<string, object?>
        {
            ["id"] = row.Id,
            ["season"] = row.Season,
            ["source"] = row.Source,
            ["schemaVersion"] = row.SchemaVersion,
            ["goals"] = v.Goals,
            ["assists"] = v.Assists,
            ["minutes"] = v.Minutes,
            ["matches"] = v.Matches,
            ["appearances"] = v.Matches,
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
            ["data"] = row.Data
        };
    }
}
