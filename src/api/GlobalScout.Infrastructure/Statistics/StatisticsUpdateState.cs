using GlobalScout.Application.Abstractions.Statistics;

namespace GlobalScout.Infrastructure.Statistics;

internal sealed class StatisticsUpdateState : IStatisticsUpdateState
{
    private readonly object _gate = new();

    private bool _bulkInProgress;

    private DateTimeOffset? _lastUpdate;

    private readonly HashSet<Guid> _userRefresh = [];

    public bool TryBeginUserRefresh(Guid userId)
    {
        lock (_gate)
        {
            return _userRefresh.Add(userId);
        }
    }

    public void EndUserRefresh(Guid userId)
    {
        lock (_gate)
        {
            _userRefresh.Remove(userId);
        }
    }

    public bool TryBeginBulkRefresh()
    {
        lock (_gate)
        {
            if (_bulkInProgress)
            {
                return false;
            }

            _bulkInProgress = true;
            return true;
        }
    }

    public void EndBulkRefresh()
    {
        lock (_gate)
        {
            _bulkInProgress = false;
        }
    }

    public void SetLastUpdate(DateTimeOffset utc)
    {
        lock (_gate)
        {
            _lastUpdate = utc;
        }
    }

    public StatisticsUpdateStatusDto GetStatus()
    {
        lock (_gate)
        {
            return new StatisticsUpdateStatusDto(
                _bulkInProgress,
                _lastUpdate,
                _userRefresh.Count,
                _userRefresh.ToList());
        }
    }
}
