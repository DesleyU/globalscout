using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.ReferenceData;
using GlobalScout.Domain.ReferenceData;

namespace GlobalScout.Application.ReferenceData.SubmitCompetition;

public sealed record SubmitFootballCompetitionCommand(
    Guid UserId,
    string Country,
    string Name,
    CompetitionLevel LevelHint,
    CompetitionType TypeHint) : ICommand<FootballCompetitionDto>;
