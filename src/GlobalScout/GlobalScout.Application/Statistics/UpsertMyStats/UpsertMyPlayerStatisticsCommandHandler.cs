using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Statistics;
using GlobalScout.Domain.Identity;
using GlobalScout.Domain.Users;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Statistics.UpsertMyStats;

internal sealed class UpsertMyPlayerStatisticsCommandHandler(IPlayerStatisticsRepository stats)
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
        var existing = rows.FirstOrDefault(r =>
            r.Season == command.Season && r.Source == StatsSource.Manual);

        var merged = Merge(command, existing, accountType.Value);
        var saved = await stats.UpsertManualAndReturnAsync(
            command.UserId,
            command.Season,
            merged,
            cancellationToken);

        var dto = PlayerStatisticsMapper.ToDto(saved);
        var dict = PlayerStatisticsMapper.ToFullDictionary(dto);
        var tier = accountType.Value.ToString().ToUpperInvariant();

        return Result.Success(new UpsertMyPlayerStatisticsResult(dict, tier));
    }

    private static ManualStatisticsValues Merge(
        UpsertMyPlayerStatisticsCommand command,
        PlayerStatistics? existing,
        AccountType tier)
    {
        bool premium = tier == AccountType.Premium;

        int IG(int? c, int e) => c ?? e;
        int? IO(int? c, int? e) => c ?? e;
        double? DG(double? c, double? e) => c ?? e;

        var existingVals = PlayerStatisticsDataPayload.ParseManualForMerge(existing?.Data);

        int baseGoals = existingVals.Goals;
        int baseAssists = existingVals.Assists;
        int baseMatches = existingVals.Matches;
        int baseMinutes = existingVals.Minutes;
        int baseY = existingVals.YellowCards;
        int baseR = existingVals.RedCards;
        double? baseRating = existingVals.Rating;

        if (!premium)
        {
            return new ManualStatisticsValues
            {
                Goals = IG(command.Goals, baseGoals),
                Assists = IG(command.Assists, baseAssists),
                Matches = IG(command.Matches, baseMatches),
                Minutes = IG(command.Minutes, baseMinutes),
                YellowCards = IG(command.YellowCards, baseY),
                RedCards = IG(command.RedCards, baseR),
                Rating = DG(command.Rating, baseRating),
                ShotsTotal = existingVals.ShotsTotal,
                ShotsOnTarget = existingVals.ShotsOnTarget,
                PassesTotal = existingVals.PassesTotal,
                PassesAccuracy = existingVals.PassesAccuracy,
                TacklesTotal = existingVals.TacklesTotal,
                TacklesInterceptions = existingVals.TacklesInterceptions,
                DuelsWon = existingVals.DuelsWon,
                FoulsCommitted = existingVals.FoulsCommitted,
                FoulsDrawn = existingVals.FoulsDrawn
            };
        }

        return new ManualStatisticsValues
        {
            Goals = IG(command.Goals, baseGoals),
            Assists = IG(command.Assists, baseAssists),
            Matches = IG(command.Matches, baseMatches),
            Minutes = IG(command.Minutes, baseMinutes),
            YellowCards = IG(command.YellowCards, baseY),
            RedCards = IG(command.RedCards, baseR),
            Rating = DG(command.Rating, baseRating),
            ShotsTotal = IO(command.ShotsTotal, existingVals.ShotsTotal),
            ShotsOnTarget = IO(command.ShotsOnTarget, existingVals.ShotsOnTarget),
            PassesTotal = IO(command.PassesTotal, existingVals.PassesTotal),
            PassesAccuracy = DG(command.PassesAccuracy, existingVals.PassesAccuracy),
            TacklesTotal = IO(command.TacklesTotal, existingVals.TacklesTotal),
            TacklesInterceptions = IO(command.TacklesInterceptions, existingVals.TacklesInterceptions),
            DuelsWon = IO(command.DuelsWon, existingVals.DuelsWon),
            FoulsCommitted = IO(command.FoulsCommitted, existingVals.FoulsCommitted),
            FoulsDrawn = IO(command.FoulsDrawn, existingVals.FoulsDrawn)
        };
    }
}
