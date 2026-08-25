using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.ReferenceData;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.ReferenceData.Admin.SetCompetitionLevel;

internal sealed class SetCompetitionLevelCommandHandler(IReferenceDataCatalog catalog)
    : ICommandHandler<SetCompetitionLevelCommand, AdminFootballCompetitionDto>
{
    public async Task<Result<AdminFootballCompetitionDto>> Handle(
        SetCompetitionLevelCommand command,
        CancellationToken cancellationToken)
    {
        var competition = await catalog.SetCompetitionLevelAsync(
            command.CompetitionId,
            command.Level,
            cancellationToken);

        if (competition is null)
        {
            return Result.Failure<AdminFootballCompetitionDto>(ReferenceDataErrors.CompetitionNotFound);
        }

        return Result.Success(competition);
    }
}
