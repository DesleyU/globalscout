using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.ReferenceData;
using GlobalScout.Domain.ReferenceData;

namespace GlobalScout.Application.ReferenceData.Admin.SetCompetitionType;

public sealed record SetCompetitionTypeCommand(
    Guid CompetitionId,
    CompetitionType Type) : ICommand<AdminFootballCompetitionDto>;
