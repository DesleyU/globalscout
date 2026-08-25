using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Abstractions.ReferenceData;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Statistics;

internal static class ManualCompetitionResolver
{
    public static async Task<Result<IReadOnlyList<ResolvedManualCompetition>>> ResolveAsync(
        string season,
        IReadOnlyList<ManualCompetitionInput> competitions,
        IReferenceDataCatalog catalog,
        CancellationToken cancellationToken)
    {
        if (competitions.Count == 0)
        {
            return Result.Failure<IReadOnlyList<ResolvedManualCompetition>>(StatsErrors.CompetitionsRequired);
        }

        if (!int.TryParse(season, out var seasonYear))
        {
            return Result.Failure<IReadOnlyList<ResolvedManualCompetition>>(StatsErrors.SeasonRequired);
        }

        var teamIds = competitions.Select(c => c.TeamCatalogId).ToArray();
        var competitionIds = competitions.Select(c => c.CompetitionCatalogId).ToArray();

        var teams = await catalog.GetTeamsByIdsAsync(teamIds, cancellationToken);
        var catalogCompetitions = await catalog.GetCompetitionsByIdsAsync(competitionIds, cancellationToken);

        var resolved = new List<ResolvedManualCompetition>(competitions.Count);
        foreach (var row in competitions)
        {
            if (!teams.TryGetValue(row.TeamCatalogId, out var team))
            {
                return Result.Failure<IReadOnlyList<ResolvedManualCompetition>>(
                    StatsErrors.UnknownCatalogReference("team", row.TeamCatalogId));
            }

            if (!catalogCompetitions.TryGetValue(row.CompetitionCatalogId, out var competition))
            {
                return Result.Failure<IReadOnlyList<ResolvedManualCompetition>>(
                    StatsErrors.UnknownCatalogReference("competition", row.CompetitionCatalogId));
            }

            resolved.Add(new ResolvedManualCompetition
            {
                TeamCatalogId = row.TeamCatalogId,
                TeamName = team.Name,
                TeamIsVerified = team.IsVerified,
                TeamExternalId = team.ExternalTeamId,
                CompetitionCatalogId = row.CompetitionCatalogId,
                CompetitionName = competition.Name,
                CompetitionCountry = competition.Country,
                Level = competition.Level.ToString(),
                CompetitionIsVerified = competition.IsVerified,
                CompetitionExternalId = competition.ExternalCompetitionId,
                SeasonYear = seasonYear,
                Appearances = row.Appearances,
                Minutes = row.Minutes,
                Goals = row.Goals,
                Assists = row.Assists,
                YellowCards = row.YellowCards,
                RedCards = row.RedCards,
                Rating = row.Rating,
            });
        }

        return Result.Success<IReadOnlyList<ResolvedManualCompetition>>(resolved);
    }
}
