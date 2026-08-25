using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Abstractions.ReferenceData;
using GlobalScout.Domain.Identity;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Statistics.UpsertMyStats;

internal sealed class UpsertMyPlayerStatisticsCommandHandler(
    IPlayerStatisticsRepository stats,
    IReferenceDataCatalog catalog)
    : ICommandHandler<UpsertMyPlayerStatisticsCommand, UpsertMyPlayerStatisticsResult>
{
    public async Task<Result<UpsertMyPlayerStatisticsResult>> Handle(
        UpsertMyPlayerStatisticsCommand command,
        CancellationToken cancellationToken)
    {
        var accountType = await stats.GetAccountTypeAsync(command.UserId, cancellationToken);
        if (accountType is null)
        {
            return Result.Failure<UpsertMyPlayerStatisticsResult>(StatsErrors.UserNotFound);
        }

        var rows = await stats.ListByUserAsync(command.UserId, cancellationToken);
        if (rows.Any(r => r.Season == command.Season && r.Source == StatsSource.ApiFootball))
        {
            return Result.Failure<UpsertMyPlayerStatisticsResult>(StatsErrors.SeasonCoveredByProvider);
        }

        var resolved = await ManualCompetitionResolver.ResolveAsync(
            command.Season,
            command.Competitions,
            catalog,
            cancellationToken);
        if (resolved.IsFailure)
        {
            return Result.Failure<UpsertMyPlayerStatisticsResult>(resolved.Error);
        }

        var premium = BuildPremiumMetrics(command, accountType.Value);
        var aggregated = ManualStatisticsAggregator.Aggregate(resolved.Value, premium);

        var saved = await stats.UpsertManualAndReturnAsync(
            command.UserId,
            command.Season,
            aggregated,
            cancellationToken);

        var dto = PlayerStatisticsMapper.ToDto(saved);
        var dict = PlayerStatisticsMapper.ToFullDictionary(dto);
        var tier = accountType.Value.ToString().ToUpperInvariant();

        return Result.Success(new UpsertMyPlayerStatisticsResult(dict, tier));
    }

    private static ManualStatisticsValues? BuildPremiumMetrics(
        UpsertMyPlayerStatisticsCommand command,
        AccountType tier)
    {
        if (tier != AccountType.Premium)
        {
            return null;
        }

        return new ManualStatisticsValues
        {
            ShotsTotal = command.ShotsTotal,
            ShotsOnTarget = command.ShotsOnTarget,
            PassesTotal = command.PassesTotal,
            PassesAccuracy = command.PassesAccuracy,
            TacklesTotal = command.TacklesTotal,
            TacklesInterceptions = command.TacklesInterceptions,
            DuelsWon = command.DuelsWon,
            FoulsCommitted = command.FoulsCommitted,
            FoulsDrawn = command.FoulsDrawn,
        };
    }
}
