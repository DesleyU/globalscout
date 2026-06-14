using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.PlayerIdentity;

namespace GlobalScout.Application.PlayerIdentity.Admin.ListClaims;

public sealed record ListAdminPlayerClaimsQuery(
    string? Status,
    string? Search,
    int Page,
    int Limit) : IQuery<ListAdminPlayerClaimsResult>;
