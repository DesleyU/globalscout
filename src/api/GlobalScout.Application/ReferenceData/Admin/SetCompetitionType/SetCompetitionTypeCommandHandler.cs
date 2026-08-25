using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.ReferenceData;
using GlobalScout.Application.ReferenceData;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.ReferenceData.Admin.SetCompetitionType;

internal sealed class SetCompetitionTypeCommandHandler(IReferenceDataCatalog catalog)
    : ICommandHandler<SetCompetitionTypeCommand, AdminFootballCompetitionDto>
{
    public async Task<Result<AdminFootballCompetitionDto>> Handle(
        SetCompetitionTypeCommand command,
        CancellationToken cancellationToken)
    {
        var competition = await catalog.SetCompetitionTypeAsync(
            command.CompetitionId,
            command.Type,
            cancellationToken);

        if (competition is null)
        {
            return Result.Failure<AdminFootballCompetitionDto>(ReferenceDataErrors.CompetitionNotFound);
        }

        return Result.Success(competition);
    }
}
