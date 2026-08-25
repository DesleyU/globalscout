using GlobalScout.Application.Abstractions.ReferenceData;

namespace GlobalScout.Application.ReferenceData;

public sealed record GetFootballCountriesResult(IReadOnlyList<FootballCountryDto> Countries);

public sealed record SearchFootballTeamsResult(IReadOnlyList<FootballTeamDto> Teams);

public sealed record ListFootballCompetitionsResult(IReadOnlyList<FootballCompetitionDto> Competitions);

public sealed record SearchFootballCompetitionsResult(IReadOnlyList<FootballCompetitionDto> Competitions);
