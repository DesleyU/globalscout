using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Domain.Identity;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Statistics.GetMyStats;

internal sealed class GetMyPlayerStatisticsQueryHandler(IPlayerStatisticsRepository stats)
    : IQueryHandler<GetMyPlayerStatisticsQuery, PlayerStatisticsResponseEnvelope>
{
    public async Task<Result<PlayerStatisticsResponseEnvelope>> Handle(
        GetMyPlayerStatisticsQuery query,
        CancellationToken cancellationToken)
    {
        var accountType = await stats.GetAccountTypeAsync(query.UserId, cancellationToken);
        if (accountType is null)
        {
            return Result.Failure<PlayerStatisticsResponseEnvelope>(StatsErrors.UserNotFound);
        }

        var rows = await stats.ListByUserAsync(query.UserId, cancellationToken);
        var dtos = rows.Select(PlayerStatisticsMapper.ToDto).ToList();
        var data = dtos.Select(PlayerStatisticsMapper.ToFullDictionary).Cast<object>().ToList();

        var tier = AccountTypeToApi(accountType.Value);
        var message = data.Count == 0
            ? "No statistics found. Add your player statistics to get started!"
            : null;

        return Result.Success(
            new PlayerStatisticsResponseEnvelope(
                Success: true,
                Data: data,
                AccountType: tier,
                AvailableFields: "all",
                TotalSeasons: data.Count,
                Message: message));
    }

    private static string AccountTypeToApi(AccountType a) => a.ToString().ToUpperInvariant();
}
