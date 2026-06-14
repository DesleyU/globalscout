namespace GlobalScout.Application.Abstractions.Statistics;

public sealed record StatisticsUpdateStatusDto(
    bool IsBulkUpdating,
    DateTimeOffset? LastUpdate,
    int QueueSize,
    IReadOnlyList<Guid> UsersInQueue);

public interface IStatisticsUpdateState
{
    bool TryBeginUserRefresh(Guid userId);

    void EndUserRefresh(Guid userId);

    bool TryBeginBulkRefresh();

    void EndBulkRefresh();

    void SetLastUpdate(DateTimeOffset utc);

    StatisticsUpdateStatusDto GetStatus();
}
