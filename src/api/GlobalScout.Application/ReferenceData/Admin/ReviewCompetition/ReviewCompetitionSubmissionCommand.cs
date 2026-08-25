using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.ReferenceData;
using GlobalScout.Domain.ReferenceData;

namespace GlobalScout.Application.ReferenceData.Admin.ReviewCompetition;

public sealed record ReviewCompetitionSubmissionCommand(
    Guid CompetitionId,
    bool Approve,
    CompetitionLevel? Level,
    CompetitionType? Type) : ICommand<AdminFootballCompetitionDto>;
