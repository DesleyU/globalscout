using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.ReferenceData;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.ReferenceData.SubmitCompetition;

internal sealed class SubmitFootballCompetitionCommandHandler(IReferenceDataCatalog catalog)
    : ICommandHandler<SubmitFootballCompetitionCommand, FootballCompetitionDto>
{
    private const int MaxPendingSubmissions = 5;

    public async Task<Result<FootballCompetitionDto>> Handle(
        SubmitFootballCompetitionCommand command,
        CancellationToken cancellationToken)
    {
        var country = FootballCountries.FindByName(command.Country)
                      ?? FootballCountries.FindByCode(command.Country);
        if (country is null)
        {
            return Result.Failure<FootballCompetitionDto>(
                ReferenceDataErrors.CountryNotSupported);
        }

        var competition = await catalog.TrySubmitCompetitionAsync(
            country.Code,
            command.Name,
            command.LevelHint,
            command.TypeHint,
            command.UserId,
            MaxPendingSubmissions,
            cancellationToken);

        return competition is null
            ? Result.Failure<FootballCompetitionDto>(
                ReferenceDataErrors.TooManyPendingSubmissions)
            : Result.Success(competition);
    }
}
