using GlobalScout.Application.Abstractions.Statistics;
using GlobalScout.Domain.Identity;
using GlobalScout.Domain.Users;

namespace GlobalScout.Application.Abstractions.Persistence;

public interface IPlayerStatisticsRepository
{
    Task<IReadOnlyList<PlayerStatistics>> ListByUserAsync(Guid userId, CancellationToken cancellationToken);

    Task<AccountType?> GetAccountTypeAsync(Guid userId, CancellationToken cancellationToken);

    Task<int?> GetApiPlayerIdAsync(Guid userId, CancellationToken cancellationToken);

    Task<bool> UserExistsAsync(Guid userId, CancellationToken cancellationToken);

    Task<PlayerStatistics> UpsertManualAndReturnAsync(
        Guid userId,
        string season,
        ManualStatisticsValues values,
        CancellationToken cancellationToken);

    Task<PlayerStatistics> UpsertApiFootballAndReturnAsync(
        Guid userId,
        AggregatedFootballSeasonStats stats,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<Guid>> GetUserIdsWithApiPlayerIdAsync(CancellationToken cancellationToken);
}

/// <summary>Writable stat fields for manual <c>PUT /stats/me</c> (after tier filtering in handler).</summary>
public sealed class ManualStatisticsValues
{
    public int Goals { get; init; }

    public int Assists { get; init; }

    public int Matches { get; init; }

    public int Minutes { get; init; }

    public int YellowCards { get; init; }

    public int RedCards { get; init; }

    public double? Rating { get; init; }

    public int? ShotsTotal { get; init; }

    public int? ShotsOnTarget { get; init; }

    public int? PassesTotal { get; init; }

    public double? PassesAccuracy { get; init; }

    public int? TacklesTotal { get; init; }

    public int? TacklesInterceptions { get; init; }

    public int? DuelsWon { get; init; }

    public int? FoulsCommitted { get; init; }

    public int? FoulsDrawn { get; init; }
}
