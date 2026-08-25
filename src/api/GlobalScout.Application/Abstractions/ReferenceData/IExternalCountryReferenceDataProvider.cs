using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Abstractions.ReferenceData;

public interface IExternalCountryReferenceDataProvider
{
    Task<Result<IReadOnlyList<ExternalFootballTeam>>> GetTeamsAsync(
        string providerCountryName,
        CancellationToken cancellationToken);

    Task<Result<IReadOnlyList<ExternalFootballCompetition>>> GetLeaguesAsync(
        string providerCountryName,
        CancellationToken cancellationToken);
}
