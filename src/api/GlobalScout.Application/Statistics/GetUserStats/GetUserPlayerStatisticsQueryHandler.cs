using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Subscriptions;
using GlobalScout.Domain.Identity;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Statistics.GetUserStats;

internal sealed class GetUserPlayerStatisticsQueryHandler(IPlayerStatisticsRepository stats)
    : IQueryHandler<GetUserPlayerStatisticsQuery, PlayerStatisticsResponseEnvelope>
{
    public async Task<Result<PlayerStatisticsResponseEnvelope>> Handle(
        GetUserPlayerStatisticsQuery query,
        CancellationToken cancellationToken)
    {
        if (!await stats.UserExistsAsync(query.TargetUserId, cancellationToken))
        {
            return Result.Failure<PlayerStatisticsResponseEnvelope>(StatsErrors.UserNotFound);
        }

        var targetTier = await stats.GetAccountTypeAsync(query.TargetUserId, cancellationToken);
        if (targetTier is null)
        {
            return Result.Failure<PlayerStatisticsResponseEnvelope>(StatsErrors.UserNotFound);
        }

        var rows = await stats.ListByUserAsync(query.TargetUserId, cancellationToken);
        var dtos = rows.Select(PlayerStatisticsMapper.ToDto).ToList();

        var isOtherBasic = targetTier == AccountType.Basic && query.TargetUserId != query.RequestingUserId;
        IReadOnlyList<object> data = isOtherBasic
            ? dtos.Select(d => (object)PlayerStatisticsMapper.ToBasicMaskedDictionary(d)).ToList()
            : dtos.Select(d => (object)PlayerStatisticsMapper.ToFullDictionary(d)).ToList();

        var tier = AccountTypeToApi(targetTier.Value);
        object availableFields = isOtherBasic
            ? SubscriptionLimits.BasicTierVisibleStatKeys
            : "all";

        return Result.Success(
            new PlayerStatisticsResponseEnvelope(
                Success: true,
                Data: data,
                AccountType: tier,
                AvailableFields: availableFields,
                TotalSeasons: data.Count,
                Message: null));
    }

    private static string AccountTypeToApi(AccountType a) => a.ToString().ToUpperInvariant();
}
