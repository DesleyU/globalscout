using GlobalScout.Application.Abstractions.ReferenceData;

namespace GlobalScout.Application.ReferenceData;

public sealed record GetFootballCountriesResult(IReadOnlyList<FootballCountryDto> Countries);

public sealed record SearchFootballTeamsResult(IReadOnlyList<FootballTeamDto> Teams);
