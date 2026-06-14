using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Abstractions.ReferenceData;
public interface IExternalTeamSearch
{
    Task<Result<IReadOnlyList<FootballTeamDto>>> SearchAsync(
        string country,
        string searchTerm,
        CancellationToken cancellationToken);
}
