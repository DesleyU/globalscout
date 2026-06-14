namespace GlobalScout.Application.Abstractions.ReferenceData;

public sealed record FootballCountryDto(
    string Name,
    string? Code,
    string? FlagUrl,
    bool IsPreloaded);

public sealed record FootballLeagueDto(
    int ExternalLeagueId,
    string Name,
    string Country,
    string? Type,
    string? LogoUrl);

/// <summary>
/// Mirrors API-football team fields from <c>response[].team</c>.
/// </summary>
public sealed record FootballTeamDto(
    int ExternalTeamId,
    string Name,
    string? Code,
    string Country,
    int? Founded,
    bool National,
    string? LogoUrl);
