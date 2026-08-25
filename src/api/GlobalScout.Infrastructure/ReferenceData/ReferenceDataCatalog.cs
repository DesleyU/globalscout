using GlobalScout.Application.Abstractions.ReferenceData;
using GlobalScout.Application.Common;
using GlobalScout.Application.ReferenceData;
using GlobalScout.Domain.ReferenceData;
using GlobalScout.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace GlobalScout.Infrastructure.ReferenceData;

internal sealed class ReferenceDataCatalog(GlobalScoutDbContext db) : IReferenceDataCatalog
{
    public async Task<IReadOnlyList<FootballTeamDto>> SearchTeamsAsync(
        string countryCode,
        string searchTerm,
        bool requiresExternalId,
        int limit,
        CancellationToken cancellationToken)
    {
        var code = NormalizeCountryCode(countryCode);
        var term = TextNormalizer.ToSearchKey(searchTerm);
        if (term.Length < 2 || limit <= 0)
        {
            return [];
        }

        IQueryable<Team> query = VisibleTeams(code);
        if (requiresExternalId)
        {
            query = query.Where(team => team.ExternalTeamId.HasValue);
        }

        query = term.Length >= 3
            ? query.Where(team =>
                EF.Functions.Like(team.NameNormalized, $"%{term}%")
                || EF.Functions.TrigramsAreSimilar(team.NameNormalized, term))
            : query.Where(team => EF.Functions.Like(team.NameNormalized, $"%{term}%"));

        var teams = await query
            .OrderByDescending(team => team.NameNormalized == term)
            .ThenByDescending(team => team.NameNormalized.StartsWith(term))
            .ThenByDescending(team => EF.Functions.TrigramsSimilarity(team.NameNormalized, term))
            .ThenBy(team => team.Name)
            .Take(limit)
            .ToListAsync(cancellationToken);

        return teams.Select(MapTeam).ToArray();
    }

    public async Task<IReadOnlyList<FootballCompetitionDto>> SearchCompetitionsAsync(
        string countryCode,
        string searchTerm,
        CompetitionLevel? level,
        int limit,
        CancellationToken cancellationToken)
    {
        var code = NormalizeCountryCode(countryCode);
        var term = TextNormalizer.ToSearchKey(searchTerm);
        if (term.Length < 2 || limit <= 0)
        {
            return [];
        }

        IQueryable<Competition> query = VisibleCompetitions(code);
        if (level is not null)
        {
            query = query.Where(competition => competition.Level == level);
        }

        query = term.Length >= 3
            ? query.Where(competition =>
                EF.Functions.Like(competition.NameNormalized, $"%{term}%")
                || EF.Functions.TrigramsAreSimilar(competition.NameNormalized, term))
            : query.Where(competition => EF.Functions.Like(competition.NameNormalized, $"%{term}%"));

        var competitions = await query
            .OrderByDescending(competition => competition.NameNormalized == term)
            .ThenByDescending(competition => competition.NameNormalized.StartsWith(term))
            .ThenByDescending(competition => EF.Functions.TrigramsSimilarity(competition.NameNormalized, term))
            .ThenBy(competition => competition.Name)
            .Take(limit)
            .ToListAsync(cancellationToken);

        return competitions.Select(MapCompetition).ToArray();
    }

    public async Task<IReadOnlyList<FootballCompetitionDto>> ListCompetitionsAsync(
        string countryCode,
        CompetitionLevel? level,
        CancellationToken cancellationToken)
    {
        IQueryable<Competition> query = VisibleCompetitions(NormalizeCountryCode(countryCode));
        if (level is not null)
        {
            query = query.Where(competition => competition.Level == level);
        }

        var competitions = await query
            .OrderBy(competition => competition.Name)
            .ToListAsync(cancellationToken);

        return competitions.Select(MapCompetition).ToArray();
    }

    public Task<ProviderUpsertResult<FootballTeamDto>> UpsertProviderTeamsAsync(
        string countryCode,
        IReadOnlyList<ExternalFootballTeam> teams,
        CancellationToken cancellationToken) =>
        UpsertProviderTeamsWithRetryAsync(
            NormalizeCountryCode(countryCode),
            teams,
            retryOnConflict: true,
            cancellationToken);

    public Task<ProviderUpsertResult<FootballCompetitionDto>> UpsertProviderCompetitionsAsync(
        string countryCode,
        IReadOnlyList<ExternalFootballCompetition> competitions,
        CancellationToken cancellationToken) =>
        UpsertProviderCompetitionsWithRetryAsync(
            NormalizeCountryCode(countryCode),
            competitions,
            retryOnConflict: true,
            cancellationToken);

    public async Task RecordCountrySyncAsync(
        string countryCode,
        int competitionCount,
        int teamCount,
        Guid adminUserId,
        DateTimeOffset syncedAt,
        CancellationToken cancellationToken)
    {
        var code = NormalizeCountryCode(countryCode);
        var state = await db.CountrySyncStates.FindAsync([code], cancellationToken);
        if (state is null)
        {
            db.CountrySyncStates.Add(new CountrySyncState
            {
                CountryCode = code,
                CompetitionsSyncedAt = syncedAt,
                TeamsSyncedAt = syncedAt,
                CompetitionCount = competitionCount,
                TeamCount = teamCount,
                LastSyncedByUserId = adminUserId
            });
        }
        else
        {
            state.CompetitionsSyncedAt = syncedAt;
            state.TeamsSyncedAt = syncedAt;
            state.CompetitionCount = competitionCount;
            state.TeamCount = teamCount;
            state.LastSyncedByUserId = adminUserId;
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<FootballTeamDto?> TrySubmitTeamAsync(
        string countryCode,
        string name,
        Guid submittedByUserId,
        int maxPendingSubmissions,
        CancellationToken cancellationToken)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        await AcquireSubmissionLockAsync(submittedByUserId, cancellationToken);
        if (await CountPendingSubmissionsAsync(submittedByUserId, cancellationToken)
            >= maxPendingSubmissions)
        {
            await transaction.RollbackAsync(cancellationToken);
            return null;
        }

        var now = DateTimeOffset.UtcNow;
        var team = new Team
        {
            Id = Guid.NewGuid(),
            CountryCode = NormalizeCountryCode(countryCode),
            Name = name.Trim(),
            NameNormalized = TextNormalizer.ToSearchKey(name),
            Source = ReferenceDataSource.UserSubmitted,
            Status = ReferenceDataStatus.Pending,
            SubmittedByUserId = submittedByUserId,
            CreatedAt = now,
            UpdatedAt = now
        };
        db.Teams.Add(team);
        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return MapTeam(team);
    }

    public async Task<FootballCompetitionDto?> TrySubmitCompetitionAsync(
        string countryCode,
        string name,
        CompetitionLevel levelHint,
        CompetitionType typeHint,
        Guid submittedByUserId,
        int maxPendingSubmissions,
        CancellationToken cancellationToken)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        await AcquireSubmissionLockAsync(submittedByUserId, cancellationToken);
        if (await CountPendingSubmissionsAsync(submittedByUserId, cancellationToken)
            >= maxPendingSubmissions)
        {
            await transaction.RollbackAsync(cancellationToken);
            return null;
        }

        var now = DateTimeOffset.UtcNow;
        var competition = new Competition
        {
            Id = Guid.NewGuid(),
            CountryCode = NormalizeCountryCode(countryCode),
            Name = name.Trim(),
            NameNormalized = TextNormalizer.ToSearchKey(name),
            Level = CompetitionLevel.Unknown,
            SubmittedLevelHint = levelHint,
            SubmittedTypeHint = typeHint,
            Source = ReferenceDataSource.UserSubmitted,
            Status = ReferenceDataStatus.Pending,
            SubmittedByUserId = submittedByUserId,
            CreatedAt = now,
            UpdatedAt = now
        };
        db.Competitions.Add(competition);
        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return MapCompetition(competition);
    }

    public async Task<IReadOnlyDictionary<Guid, FootballTeamDto>> GetTeamsByIdsAsync(
        IReadOnlyCollection<Guid> ids,
        CancellationToken cancellationToken)
    {
        if (ids.Count == 0)
        {
            return new Dictionary<Guid, FootballTeamDto>();
        }

        var distinctIds = ids.Distinct().ToArray();
        var teams = await db.Teams.AsNoTracking()
            .Where(team => distinctIds.Contains(team.Id))
            .ToListAsync(cancellationToken);

        var resolved = new Dictionary<Guid, FootballTeamDto>();
        foreach (var requestedId in distinctIds)
        {
            var team = await ResolveTeamAsync(requestedId, teams, cancellationToken);
            if (team is not null)
            {
                resolved[requestedId] = MapTeam(team);
            }
        }

        return resolved;
    }

    public async Task<IReadOnlyDictionary<Guid, FootballCompetitionDto>> GetCompetitionsByIdsAsync(
        IReadOnlyCollection<Guid> ids,
        CancellationToken cancellationToken)
    {
        if (ids.Count == 0)
        {
            return new Dictionary<Guid, FootballCompetitionDto>();
        }

        var distinctIds = ids.Distinct().ToArray();
        var competitions = await db.Competitions.AsNoTracking()
            .Where(competition => distinctIds.Contains(competition.Id))
            .ToListAsync(cancellationToken);

        var resolved = new Dictionary<Guid, FootballCompetitionDto>();
        foreach (var requestedId in distinctIds)
        {
            var competition = await ResolveCompetitionAsync(requestedId, competitions, cancellationToken);
            if (competition is not null)
            {
                resolved[requestedId] = MapCompetition(competition);
            }
        }

        return resolved;
    }

    public async Task<IReadOnlyList<AdminReferenceDataCountryDto>> ListCountrySummariesAsync(
        CancellationToken cancellationToken)
    {
        var competitionCounts = await db.Competitions.AsNoTracking()
            .Where(competition => competition.Status != ReferenceDataStatus.Merged)
            .GroupBy(competition => competition.CountryCode)
            .Select(group => new CountryCompetitionCounts(
                group.Key,
                group.Count(),
                group.Count(competition => competition.Level == CompetitionLevel.Unknown),
                group.Count(competition => competition.Status == ReferenceDataStatus.Pending)))
            .ToListAsync(cancellationToken);

        var countsByCode = competitionCounts.ToDictionary(
            counts => counts.CountryCode,
            StringComparer.OrdinalIgnoreCase);

        var syncStates = await db.CountrySyncStates.AsNoTracking()
            .ToDictionaryAsync(state => state.CountryCode, cancellationToken);

        return FootballCountries.GetAll()
            .Select(country =>
            {
                var code = country.Code ?? string.Empty;
                var counts = countsByCode.GetValueOrDefault(code);
                var sync = syncStates.GetValueOrDefault(code);

                return new AdminReferenceDataCountryDto(
                    country.Name,
                    country.Code,
                    country.FlagUrl,
                    counts?.CompetitionCount ?? 0,
                    counts?.CompetitionsNeedingLevelCount ?? 0,
                    counts?.PendingCompetitionCount ?? 0,
                    sync?.TeamCount ?? 0,
                    sync?.CompetitionsSyncedAt);
            })
            .ToArray();
    }

    public async Task<IReadOnlyList<AdminFootballCompetitionDto>> ListCompetitionsForReviewAsync(
        string countryCode,
        CancellationToken cancellationToken)
    {
        var code = NormalizeCountryCode(countryCode);
        var competitions = await db.Competitions.AsNoTracking()
            .Where(competition =>
                competition.CountryCode == code
                && competition.Status != ReferenceDataStatus.Merged)
            .OrderByDescending(competition => competition.Status == ReferenceDataStatus.Pending)
            .ThenBy(competition => competition.Name)
            .ToListAsync(cancellationToken);

        return competitions.Select(MapAdminCompetition).ToArray();
    }

    public async Task<AdminFootballCompetitionDto?> TryGetCompetitionForReviewByIdAsync(
        Guid competitionId,
        CancellationToken cancellationToken)
    {
        var competition = await db.Competitions.AsNoTracking()
            .FirstOrDefaultAsync(
                candidate =>
                    candidate.Id == competitionId
                    && candidate.Status != ReferenceDataStatus.Merged,
                cancellationToken);

        return competition is null ? null : MapAdminCompetition(competition);
    }

    public async Task<AdminFootballCompetitionDto?> SetCompetitionLevelAsync(
        Guid competitionId,
        CompetitionLevel level,
        CancellationToken cancellationToken)
    {
        var competition = await db.Competitions.FirstOrDefaultAsync(
            candidate =>
                candidate.Id == competitionId
                && candidate.Status != ReferenceDataStatus.Merged,
            cancellationToken);
        if (competition is null)
        {
            return null;
        }

        competition.Level = level;
        competition.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);

        return MapAdminCompetition(competition);
    }

    public async Task<AdminFootballCompetitionDto?> SetCompetitionTypeAsync(
        Guid competitionId,
        CompetitionType type,
        CancellationToken cancellationToken)
    {
        var competition = await db.Competitions.FirstOrDefaultAsync(
            candidate =>
                candidate.Id == competitionId
                && candidate.Status != ReferenceDataStatus.Merged,
            cancellationToken);
        if (competition is null)
        {
            return null;
        }

        competition.Type = CompetitionTypes.ToApiString(type);
        competition.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);

        return MapAdminCompetition(competition);
    }

    public async Task<AdminFootballCompetitionDto?> ReviewCompetitionAsync(
        Guid competitionId,
        ReferenceDataStatus status,
        CompetitionLevel? level,
        CompetitionType? type,
        CancellationToken cancellationToken)
    {
        var competition = await db.Competitions.FirstOrDefaultAsync(
            candidate => candidate.Id == competitionId,
            cancellationToken);
        if (competition is null)
        {
            return null;
        }

        competition.Status = status;
        if (level is not null)
        {
            competition.Level = level.Value;
        }

        if (type is not null)
        {
            competition.Type = CompetitionTypes.ToApiString(type);
        }

        competition.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);

        return MapAdminCompetition(competition);
    }

    private async Task<ProviderUpsertResult<FootballTeamDto>> UpsertProviderTeamsWithRetryAsync(
        string countryCode,
        IReadOnlyList<ExternalFootballTeam> teams,
        bool retryOnConflict,
        CancellationToken cancellationToken)
    {
        var incoming = teams
            .Where(team => team.ExternalTeamId > 0 && !string.IsNullOrWhiteSpace(team.Name))
            .GroupBy(team => team.ExternalTeamId)
            .Select(group => group.Last())
            .ToArray();
        if (incoming.Length == 0)
        {
            return new ProviderUpsertResult<FootballTeamDto>([], 0, 0);
        }

        var externalIds = incoming.Select(team => team.ExternalTeamId).ToArray();
        var existingByExternalId = await db.Teams
            .Where(team =>
                team.ExternalTeamId.HasValue
                && externalIds.Contains(team.ExternalTeamId.Value))
            .ToDictionaryAsync(team => team.ExternalTeamId!.Value, cancellationToken);
        var now = DateTimeOffset.UtcNow;

        foreach (var providerTeam in incoming)
        {
            if (!existingByExternalId.TryGetValue(providerTeam.ExternalTeamId, out var team))
            {
                db.Teams.Add(new Team
                {
                    Id = Guid.NewGuid(),
                    CountryCode = countryCode,
                    Name = providerTeam.Name.Trim(),
                    NameNormalized = TextNormalizer.ToSearchKey(providerTeam.Name),
                    ExternalTeamId = providerTeam.ExternalTeamId,
                    Code = providerTeam.Code,
                    Founded = providerTeam.Founded,
                    IsNational = providerTeam.National,
                    LogoUrl = providerTeam.LogoUrl,
                    Source = ReferenceDataSource.Provider,
                    Status = ReferenceDataStatus.Approved,
                    CreatedAt = now,
                    UpdatedAt = now
                });
                continue;
            }

            if (team.Source != ReferenceDataSource.AdminCurated)
            {
                team.CountryCode = countryCode;
                team.Name = providerTeam.Name.Trim();
                team.NameNormalized = TextNormalizer.ToSearchKey(providerTeam.Name);
                team.Source = ReferenceDataSource.Provider;
                team.Status = ReferenceDataStatus.Approved;
            }

            team.Code = providerTeam.Code;
            team.Founded = providerTeam.Founded;
            team.IsNational = providerTeam.National;
            team.LogoUrl = providerTeam.LogoUrl;
            team.UpdatedAt = now;
        }

        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (retryOnConflict && IsUniqueViolation(exception))
        {
            db.ChangeTracker.Clear();
            return await UpsertProviderTeamsWithRetryAsync(
                countryCode,
                incoming,
                retryOnConflict: false,
                cancellationToken);
        }

        var persisted = await db.Teams.AsNoTracking()
            .Where(team =>
                team.ExternalTeamId.HasValue
                && externalIds.Contains(team.ExternalTeamId.Value))
            .OrderBy(team => team.Name)
            .ToListAsync(cancellationToken);

        return new ProviderUpsertResult<FootballTeamDto>(
            persisted.Select(MapTeam).ToArray(),
            incoming.Length - existingByExternalId.Count,
            existingByExternalId.Count);
    }

    private async Task<ProviderUpsertResult<FootballCompetitionDto>> UpsertProviderCompetitionsWithRetryAsync(
        string countryCode,
        IReadOnlyList<ExternalFootballCompetition> competitions,
        bool retryOnConflict,
        CancellationToken cancellationToken)
    {
        var incoming = competitions
            .Where(competition => competition.ExternalCompetitionId > 0 && !string.IsNullOrWhiteSpace(competition.Name))
            .GroupBy(competition => competition.ExternalCompetitionId)
            .Select(group => group.Last())
            .ToArray();
        if (incoming.Length == 0)
        {
            return new ProviderUpsertResult<FootballCompetitionDto>([], 0, 0);
        }

        var externalIds = incoming.Select(competition => competition.ExternalCompetitionId).ToArray();
        var existingByExternalId = await db.Competitions
            .Where(competition =>
                competition.ExternalCompetitionId.HasValue
                && externalIds.Contains(competition.ExternalCompetitionId.Value))
            .ToDictionaryAsync(competition => competition.ExternalCompetitionId!.Value, cancellationToken);
        var now = DateTimeOffset.UtcNow;

        foreach (var providerCompetition in incoming)
        {
            if (!existingByExternalId.TryGetValue(providerCompetition.ExternalCompetitionId, out var competition))
            {
                db.Competitions.Add(new Competition
                {
                    Id = Guid.NewGuid(),
                    CountryCode = countryCode,
                    Name = providerCompetition.Name.Trim(),
                    NameNormalized = TextNormalizer.ToSearchKey(providerCompetition.Name),
                    ExternalCompetitionId = providerCompetition.ExternalCompetitionId,
                    Type = providerCompetition.Type,
                    Level = CompetitionLevel.Unknown,
                    LogoUrl = providerCompetition.LogoUrl,
                    Source = ReferenceDataSource.Provider,
                    Status = ReferenceDataStatus.Approved,
                    CreatedAt = now,
                    UpdatedAt = now
                });
                continue;
            }

            if (competition.Source != ReferenceDataSource.AdminCurated)
            {
                competition.CountryCode = countryCode;
                competition.Name = providerCompetition.Name.Trim();
                competition.NameNormalized = TextNormalizer.ToSearchKey(providerCompetition.Name);
                competition.Source = ReferenceDataSource.Provider;
                competition.Status = ReferenceDataStatus.Approved;
            }

            competition.Type = providerCompetition.Type;
            competition.LogoUrl = providerCompetition.LogoUrl;
            competition.UpdatedAt = now;
        }

        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (retryOnConflict && IsUniqueViolation(exception))
        {
            db.ChangeTracker.Clear();
            return await UpsertProviderCompetitionsWithRetryAsync(
                countryCode,
                incoming,
                retryOnConflict: false,
                cancellationToken);
        }

        var persisted = await db.Competitions.AsNoTracking()
            .Where(competition =>
                competition.ExternalCompetitionId.HasValue
                && externalIds.Contains(competition.ExternalCompetitionId.Value))
            .OrderBy(competition => competition.Name)
            .ToListAsync(cancellationToken);

        return new ProviderUpsertResult<FootballCompetitionDto>(
            persisted.Select(MapCompetition).ToArray(),
            incoming.Length - existingByExternalId.Count,
            existingByExternalId.Count);
    }

    private IQueryable<Team> VisibleTeams(string countryCode) =>
        db.Teams.AsNoTracking()
            .Where(team =>
                team.CountryCode == countryCode
                && (team.Status == ReferenceDataStatus.Approved
                    || team.Status == ReferenceDataStatus.Pending));

    private IQueryable<Competition> VisibleCompetitions(string countryCode) =>
        db.Competitions.AsNoTracking()
            .Where(competition =>
                competition.CountryCode == countryCode
                && (competition.Status == ReferenceDataStatus.Approved
                    || competition.Status == ReferenceDataStatus.Pending));

    private async Task<Team?> ResolveTeamAsync(
        Guid requestedId,
        IReadOnlyList<Team> preloaded,
        CancellationToken cancellationToken)
    {
        var currentId = requestedId;
        for (var hop = 0; hop < 8; hop++)
        {
            var team = preloaded.FirstOrDefault(t => t.Id == currentId)
                       ?? await db.Teams.AsNoTracking().FirstOrDefaultAsync(t => t.Id == currentId, cancellationToken);
            if (team is null)
            {
                return null;
            }

            if (team.Status is ReferenceDataStatus.Merged && team.MergedIntoTeamId is Guid nextId)
            {
                currentId = nextId;
                continue;
            }

            return team.Status is ReferenceDataStatus.Approved or ReferenceDataStatus.Pending
                ? team
                : null;
        }

        return null;
    }

    private async Task<Competition?> ResolveCompetitionAsync(
        Guid requestedId,
        IReadOnlyList<Competition> preloaded,
        CancellationToken cancellationToken)
    {
        var currentId = requestedId;
        for (var hop = 0; hop < 8; hop++)
        {
            var competition = preloaded.FirstOrDefault(l => l.Id == currentId)
                         ?? await db.Competitions.AsNoTracking().FirstOrDefaultAsync(l => l.Id == currentId, cancellationToken);
            if (competition is null)
            {
                return null;
            }

            if (competition.Status is ReferenceDataStatus.Merged && competition.MergedIntoCompetitionId is Guid nextId)
            {
                currentId = nextId;
                continue;
            }

            return competition.Status is ReferenceDataStatus.Approved or ReferenceDataStatus.Pending
                ? competition
                : null;
        }

        return null;
    }

    private Task AcquireSubmissionLockAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var lockKey = userId.ToString("N");
        return db.Database.ExecuteSqlInterpolatedAsync(
            $"SELECT pg_advisory_xact_lock(hashtextextended({lockKey}, 0));",
            cancellationToken);
    }

    private async Task<int> CountPendingSubmissionsAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var pendingTeams = await db.Teams.CountAsync(
            team =>
                team.SubmittedByUserId == userId
                && team.Status == ReferenceDataStatus.Pending,
            cancellationToken);
        var pendingCompetitions = await db.Competitions.CountAsync(
            competition =>
                competition.SubmittedByUserId == userId
                && competition.Status == ReferenceDataStatus.Pending,
            cancellationToken);

        return pendingTeams + pendingCompetitions;
    }

    private static FootballTeamDto MapTeam(Team team) =>
        new(
            team.Id,
            team.ExternalTeamId,
            team.Name,
            team.Code,
            CountryName(team.CountryCode),
            team.Founded,
            team.IsNational,
            team.LogoUrl,
            team.Status == ReferenceDataStatus.Approved);

    private static FootballCompetitionDto MapCompetition(Competition competition) =>
        new(
            competition.Id,
            competition.ExternalCompetitionId,
            competition.Name,
            CountryName(competition.CountryCode),
            CompetitionTypes.ResolveDisplayType(competition.Type, competition.SubmittedTypeHint),
            competition.LogoUrl,
            competition.Level,
            competition.Status == ReferenceDataStatus.Approved);

    private static AdminFootballCompetitionDto MapAdminCompetition(Competition competition) =>
        new(
            competition.Id,
            competition.ExternalCompetitionId,
            competition.Name,
            competition.CountryCode,
            competition.Type,
            competition.LogoUrl,
            competition.Level,
            competition.SubmittedLevelHint,
            competition.SubmittedTypeHint,
            competition.Source,
            competition.Status,
            competition.SubmittedByUserId,
            competition.CreatedAt,
            competition.UpdatedAt);

    private sealed record CountryCompetitionCounts(
        string CountryCode,
        int CompetitionCount,
        int CompetitionsNeedingLevelCount,
        int PendingCompetitionCount);

    private static string CountryName(string countryCode) =>
        FootballCountries.FindByCode(countryCode)?.Name ?? countryCode;

    private static string NormalizeCountryCode(string countryCode) =>
        countryCode.Trim().ToUpperInvariant();

    private static bool IsUniqueViolation(DbUpdateException exception) =>
        exception.InnerException is PostgresException
        {
            SqlState: PostgresErrorCodes.UniqueViolation
        };
}
