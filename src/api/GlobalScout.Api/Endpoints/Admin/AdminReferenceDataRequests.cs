using GlobalScout.Domain.ReferenceData;

namespace GlobalScout.Api.Endpoints.Admin;

internal sealed record SetCompetitionLevelRequest(CompetitionLevel Level);

internal sealed record SetCompetitionTypeRequest(CompetitionType Type);

internal sealed record ApproveCompetitionRequest(
    CompetitionLevel Level,
    CompetitionType Type);
