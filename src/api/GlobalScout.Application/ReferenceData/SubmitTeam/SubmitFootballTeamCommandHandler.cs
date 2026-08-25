using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.ReferenceData;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.ReferenceData.SubmitTeam;

internal sealed class SubmitFootballTeamCommandHandler(IReferenceDataCatalog catalog)
    : ICommandHandler<SubmitFootballTeamCommand, FootballTeamDto>
{
    private const int MaxPendingSubmissions = 5;

    public async Task<Result<FootballTeamDto>> Handle(
        SubmitFootballTeamCommand command,
        CancellationToken cancellationToken)
    {
        var country = FootballCountries.FindByName(command.Country)
                      ?? FootballCountries.FindByCode(command.Country);
        if (country is null)
        {
            return Result.Failure<FootballTeamDto>(
                ReferenceDataErrors.CountryNotSupported);
        }

        var team = await catalog.TrySubmitTeamAsync(
            country.Code,
            command.Name,
            command.UserId,
            MaxPendingSubmissions,
            cancellationToken);

        return team is null
            ? Result.Failure<FootballTeamDto>(
                ReferenceDataErrors.TooManyPendingSubmissions)
            : Result.Success(team);
    }
}
