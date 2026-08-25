using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.ReferenceData;
using GlobalScout.Domain.ReferenceData;

namespace GlobalScout.Application.ReferenceData.Admin.SetCompetitionLevel;

public sealed record SetCompetitionLevelCommand(
    Guid CompetitionId,
    CompetitionLevel Level) : ICommand<AdminFootballCompetitionDto>;
