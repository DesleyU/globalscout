using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.ReferenceData;

namespace GlobalScout.Application.ReferenceData.SearchTeams;

public sealed record SearchFootballTeamsQuery(string Country, string SearchTerm)
    : IQuery<SearchFootballTeamsResult>;
