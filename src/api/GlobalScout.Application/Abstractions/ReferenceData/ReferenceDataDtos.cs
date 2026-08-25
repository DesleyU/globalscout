using GlobalScout.Domain.ReferenceData;

namespace GlobalScout.Application.Abstractions.ReferenceData;

public sealed record FootballCountryDto(
    string Name,
    string? Code,
    string? FlagUrl);

public sealed record FootballCompetitionDto(
    Guid Id,
    int? ExternalCompetitionId,
    string Name,
    string Country,
    string? Type,
    string? LogoUrl,
    CompetitionLevel Level,
    bool IsVerified);

public sealed record FootballTeamDto(
    Guid Id,
    int? ExternalTeamId,
    string Name,
    string? Code,
    string Country,
    int? Founded,
    bool National,
    string? LogoUrl,
    bool IsVerified);

public sealed record ExternalFootballTeam(
    int ExternalTeamId,
    string Name,
    string? Code,
    int? Founded,
    bool National,
    string? LogoUrl);

public sealed record ExternalFootballCompetition(
    int ExternalCompetitionId,
    string Name,
    string? Type,
    string? LogoUrl);

public sealed record ProviderUpsertResult<T>(
    IReadOnlyList<T> Items,
    int AddedCount,
    int UpdatedCount);

public sealed record AdminReferenceDataCountryDto(
    string Name,
    string? Code,
    string? FlagUrl,
    int CompetitionCount,
    int CompetitionsNeedingLevelCount,
    int PendingCompetitionCount,
    int TeamCount,
    DateTimeOffset? LastSyncedAt);

public sealed record AdminFootballCompetitionDto(
    Guid Id,
    int? ExternalCompetitionId,
    string Name,
    string CountryCode,
    string? Type,
    string? LogoUrl,
    CompetitionLevel Level,
    CompetitionLevel? SubmittedLevelHint,
    CompetitionType? SubmittedTypeHint,
    ReferenceDataSource Source,
    ReferenceDataStatus Status,
    Guid? SubmittedByUserId,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
