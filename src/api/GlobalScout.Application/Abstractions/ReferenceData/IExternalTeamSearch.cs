using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Abstractions.ReferenceData;
public interface IExternalTeamSearch
{
    Task<Result<IReadOnlyList<ExternalFootballTeam>>> SearchAsync(
        string country,
        string searchTerm,
        CancellationToken cancellationToken);
}
