using GlobalScout.Domain.ReferenceData;

namespace GlobalScout.Api.Endpoints.ReferenceData;

internal sealed record SearchFootballTeamsRequest(
    string Country,
    string SearchTerm,
    bool RequiresExternalId = false);

internal sealed record SearchFootballCompetitionsRequest(
    string Country,
    string SearchTerm,
    CompetitionLevel? Level);

internal sealed record SubmitFootballTeamRequest(string Country, string Name);

internal sealed record SubmitFootballCompetitionRequest(
    string Country,
    string Name,
    CompetitionLevel LevelHint,
    CompetitionType TypeHint);
