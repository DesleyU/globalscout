using GlobalScout.Domain.ReferenceData;

namespace GlobalScout.Application.Abstractions.ReferenceData;

public interface IReferenceDataCatalog
{
    Task<IReadOnlyList<FootballTeamDto>> SearchTeamsAsync(
        string countryCode,
        string searchTerm,
        bool requiresExternalId,
        int limit,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<FootballCompetitionDto>> SearchCompetitionsAsync(
        string countryCode,
        string searchTerm,
        CompetitionLevel? level,
        int limit,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<FootballCompetitionDto>> ListCompetitionsAsync(
        string countryCode,
        CompetitionLevel? level,
        CancellationToken cancellationToken);

    Task<ProviderUpsertResult<FootballTeamDto>> UpsertProviderTeamsAsync(
        string countryCode,
        IReadOnlyList<ExternalFootballTeam> teams,
        CancellationToken cancellationToken);

    Task<ProviderUpsertResult<FootballCompetitionDto>> UpsertProviderCompetitionsAsync(
        string countryCode,
        IReadOnlyList<ExternalFootballCompetition> competitions,
        CancellationToken cancellationToken);

    Task RecordCountrySyncAsync(
        string countryCode,
        int competitionCount,
        int teamCount,
        Guid adminUserId,
        DateTimeOffset syncedAt,
        CancellationToken cancellationToken);

    Task<FootballTeamDto?> TrySubmitTeamAsync(
        string countryCode,
        string name,
        Guid submittedByUserId,
        int maxPendingSubmissions,
        CancellationToken cancellationToken);

    Task<FootballCompetitionDto?> TrySubmitCompetitionAsync(
        string countryCode,
        string name,
        CompetitionLevel levelHint,
        CompetitionType typeHint,
        Guid submittedByUserId,
        int maxPendingSubmissions,
        CancellationToken cancellationToken);

    Task<IReadOnlyDictionary<Guid, FootballTeamDto>> GetTeamsByIdsAsync(
        IReadOnlyCollection<Guid> ids,
        CancellationToken cancellationToken);

    Task<IReadOnlyDictionary<Guid, FootballCompetitionDto>> GetCompetitionsByIdsAsync(
        IReadOnlyCollection<Guid> ids,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<AdminReferenceDataCountryDto>> ListCountrySummariesAsync(
        CancellationToken cancellationToken);

    Task<IReadOnlyList<AdminFootballCompetitionDto>> ListCompetitionsForReviewAsync(
        string countryCode,
        CancellationToken cancellationToken);

    Task<AdminFootballCompetitionDto?> TryGetCompetitionForReviewByIdAsync(
        Guid competitionId,
        CancellationToken cancellationToken);

    Task<AdminFootballCompetitionDto?> SetCompetitionLevelAsync(
        Guid competitionId,
        CompetitionLevel level,
        CancellationToken cancellationToken);

    Task<AdminFootballCompetitionDto?> SetCompetitionTypeAsync(
        Guid competitionId,
        CompetitionType type,
        CancellationToken cancellationToken);

    Task<AdminFootballCompetitionDto?> ReviewCompetitionAsync(
        Guid competitionId,
        ReferenceDataStatus status,
        CompetitionLevel? level,
        CompetitionType? type,
        CancellationToken cancellationToken);
}
