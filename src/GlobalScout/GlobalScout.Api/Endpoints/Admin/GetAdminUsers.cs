using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Admin.ListUsers;
using GlobalScout.Application.Authorization;
using GlobalScout.SharedKernel;

namespace GlobalScout.Api.Endpoints.Admin;

internal sealed class GetAdminUsers : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet(
                AdminRoutes.Users,
                async (
                    ClaimsPrincipal principal,
                    IQueryHandler<ListAdminUsersQuery, AdminUsersListResult> handler,
                    string? status,
                    string? role,
                    string? search,
                    int? page,
                    int? limit,
                    CancellationToken cancellationToken) =>
                {
                    var userId = HttpUser.ResolveId(principal);
                    if (userId is null)
                    {
                        return Results.Unauthorized();
                    }

                    var query = new ListAdminUsersQuery(status, role, search, page ?? 1, limit ?? 20);
                    var result = await handler.Handle(query, cancellationToken);
                    return result.Match(Results.Ok, CustomResults.Problem);
                })
            .RequireAuthorization(AuthorizationPolicyNames.Admin)
            .WithName("AdminListUsers")
            .WithTags(AdminEndpointTags.Admin);
    }
}
