using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Domain.ReferenceData;

namespace GlobalScout.Application.ReferenceData.ListCompetitions;

public sealed record ListFootballCompetitionsQuery(
    string Country,
    CompetitionLevel? Level) : IQuery<ListFootballCompetitionsResult>;
