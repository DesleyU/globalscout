using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Domain.ReferenceData;

namespace GlobalScout.Application.ReferenceData.SearchCompetitions;

public sealed record SearchFootballCompetitionsQuery(
    string Country,
    string SearchTerm,
    CompetitionLevel? Level) : IQuery<SearchFootballCompetitionsResult>;
