using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Abstractions.PlayerIdentity;

public interface IExternalPlayerSearch
{
    Task<Result<IReadOnlyList<ExternalPlayerCandidate>>> SearchAsync(
        PlayerSearchCriteria criteria,
        CancellationToken cancellationToken);
}
