using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Authorization;
using GlobalScout.Application.PlayerIdentity;
using GlobalScout.Application.PlayerIdentity.Admin.ListClaims;

namespace GlobalScout.Api.Endpoints.Admin;

internal sealed class GetAdminPlayerClaims : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet(
                AdminRoutes.PlayerClaims,
                async (
                    ClaimsPrincipal principal,
                    IQueryHandler<ListAdminPlayerClaimsQuery, ListAdminPlayerClaimsResult> handler,
                    string? status,
                    string? search,
                    int? page,
                    int? limit,
                    CancellationToken cancellationToken) =>
                {
                    var adminId = HttpUser.ResolveId(principal);
                    if (adminId is null)
                    {
                        return Results.Unauthorized();
                    }

                    var result = await handler.Handle(
                        new ListAdminPlayerClaimsQuery(status, search, page ?? 1, limit ?? 20),
                        cancellationToken);

                    return result.Match(Results.Ok, CustomResults.Problem);
                })
            .RequireAuthorization(AuthorizationPolicyNames.Admin)
            .WithName("AdminListPlayerClaims")
            .WithTags(AdminEndpointTags.Admin);
    }
}
