using System.Text.Json;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Abstractions.Statistics;
using GlobalScout.Application.Statistics;
using GlobalScout.Domain.Identity;
using GlobalScout.Domain.Users;
using GlobalScout.Infrastructure.Data;
using GlobalScout.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;

namespace GlobalScout.Infrastructure.Statistics;

internal sealed class PlayerStatisticsRepository(GlobalScoutDbContext db) : IPlayerStatisticsRepository
{
    public async Task<IReadOnlyList<PlayerStatistics>> ListByUserAsync(
        Guid userId,
        CancellationToken cancellationToken) =>
        await db.PlayerStatistics.AsNoTracking()
            .Where(p => p.UserId == userId)
            .OrderByDescending(p => p.Season)
            .ThenBy(p => p.Source)
            .ToListAsync(cancellationToken);

    public async Task<AccountType?> GetAccountTypeAsync(Guid userId, CancellationToken cancellationToken)
    {
        var t = await db.Users.AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => (AccountType?)u.AccountType)
            .FirstOrDefaultAsync(cancellationToken);
        return t;
    }

    public async Task<int?> GetApiPlayerIdAsync(Guid userId, CancellationToken cancellationToken) =>
        await db.Users.AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => u.PlayerId)
            .FirstOrDefaultAsync(cancellationToken);

    public async Task<bool> UserExistsAsync(Guid userId, CancellationToken cancellationToken) =>
        await db.Users.AsNoTracking().AnyAsync(u => u.Id == userId, cancellationToken);

    public async Task<PlayerStatistics> UpsertManualAndReturnAsync(
        Guid userId,
        string season,
        ManualStatisticsValues v,
        CancellationToken cancellationToken)
    {
        var row = await db.PlayerStatistics.FirstOrDefaultAsync(
            p => p.UserId == userId && p.Season == season && p.Source == StatsSource.Manual,
            cancellationToken);

        var now = DateTimeOffset.UtcNow;
        var dataDoc = PlayerStatisticsDataPayload.CreateManualDocument(season, v);

        if (row is null)
        {
            row = new PlayerStatistics
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Season = season,
                Source = StatsSource.Manual,
                SchemaVersion = "1",
                Data = dataDoc,
                CreatedAt = now,
                UpdatedAt = now
            };
            db.PlayerStatistics.Add(row);
        }
        else
        {
            row.Data = dataDoc;
            row.SchemaVersion = "1";
            row.UpdatedAt = now;
        }

        await db.SaveChangesAsync(cancellationToken);
        return row;
    }

    public async Task<PlayerStatistics> UpsertApiFootballAndReturnAsync(
        Guid userId,
        AggregatedFootballSeasonStats stats,
        CancellationToken cancellationToken)
    {
        var seasonKey = stats.SeasonYear.ToString();
        var row = await db.PlayerStatistics.FirstOrDefaultAsync(
            p => p.UserId == userId && p.Season == seasonKey && p.Source == StatsSource.ApiFootball,
            cancellationToken);

        var now = DateTimeOffset.UtcNow;
        if (row is null)
        {
            row = new PlayerStatistics
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Season = seasonKey,
                Source = StatsSource.ApiFootball,
                SchemaVersion = "api-football-v1",
                Data = stats.DetailDocument,
                CreatedAt = now,
                UpdatedAt = now
            };
            db.PlayerStatistics.Add(row);
        }
        else
        {
            row.Data = stats.DetailDocument;
            row.SchemaVersion = "api-football-v1";
            row.UpdatedAt = now;
        }

        await db.SaveChangesAsync(cancellationToken);
        return row;
    }

    public async Task<IReadOnlyList<Guid>> GetUserIdsWithApiPlayerIdAsync(CancellationToken cancellationToken) =>
        await db.Users.AsNoTracking()
            .Where(u => u.PlayerId != null)
            .Select(u => u.Id)
            .ToListAsync(cancellationToken);
}
