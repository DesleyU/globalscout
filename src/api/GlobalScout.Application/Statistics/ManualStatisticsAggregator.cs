using GlobalScout.Application.Abstractions.Persistence;

namespace GlobalScout.Application.Statistics;

internal static class ManualStatisticsAggregator
{
    public static ManualStatisticsValues Aggregate(
        IReadOnlyList<ResolvedManualCompetition> competitions,
        ManualStatisticsValues? premiumMetrics = null)
    {
        if (competitions.Count == 0)
        {
            return premiumMetrics ?? new ManualStatisticsValues();
        }

        var goals = 0;
        var assists = 0;
        var appearances = 0;
        var minutes = 0;
        var yellow = 0;
        var red = 0;
        double ratingSum = 0;
        var ratingWeight = 0;

        foreach (var row in competitions)
        {
            goals += row.Goals;
            assists += row.Assists;
            appearances += row.Appearances;
            minutes += row.Minutes;
            yellow += row.YellowCards;
            red += row.RedCards;

            if (row.Rating is double rating)
            {
                var weight = row.Appearances > 0 ? row.Appearances : 1;
                ratingSum += rating * weight;
                ratingWeight += weight;
            }
        }

        double? aggregatedRating = ratingWeight > 0 ? ratingSum / ratingWeight : null;

        return new ManualStatisticsValues
        {
            Goals = goals,
            Assists = assists,
            Matches = appearances,
            Minutes = minutes,
            YellowCards = yellow,
            RedCards = red,
            Rating = aggregatedRating,
            Competitions = competitions,
            ShotsTotal = premiumMetrics?.ShotsTotal,
            ShotsOnTarget = premiumMetrics?.ShotsOnTarget,
            PassesTotal = premiumMetrics?.PassesTotal,
            PassesAccuracy = premiumMetrics?.PassesAccuracy,
            TacklesTotal = premiumMetrics?.TacklesTotal,
            TacklesInterceptions = premiumMetrics?.TacklesInterceptions,
            DuelsWon = premiumMetrics?.DuelsWon,
            FoulsCommitted = premiumMetrics?.FoulsCommitted,
            FoulsDrawn = premiumMetrics?.FoulsDrawn,
        };
    }
}
