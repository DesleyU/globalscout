using GlobalScout.Domain.PlayerIdentity;

namespace GlobalScout.Application.Abstractions.Persistence;

public sealed record AdminPlayerClaimsListCriteria(
    ClaimStatus? Status,
    string? Search,
    int Page,
    int Limit);

public sealed record AdminPlayerClaimsListPage(
    IReadOnlyList<PlayerIdentityClaim> Claims,
    int Total);
