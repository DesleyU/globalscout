using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Users;
using GlobalScout.Application.Users.Search;
using GlobalScout.SharedKernel;

namespace GlobalScout.Api.Endpoints.Users;

internal sealed class GetUsersSearch : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet(
                UsersRoutes.Search,
                async (
                    ClaimsPrincipal principal,
                    IQueryHandler<SearchUsersQuery, SearchUsersResult> handler,
                    string? role,
                    string? position,
                    string? club,
                    string? country,
                    string? city,
                    int? minAge,
                    int? maxAge,
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

                    var query = new SearchUsersQuery(
                        userId.Value,
                        role,
                        position,
                        club,
                        country,
                        city,
                        minAge,
                        maxAge,
                        search,
                        page ?? 1,
                        limit ?? 20);

                    var result = await handler.Handle(query, cancellationToken);

                    return result.Match(Results.Ok, CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("SearchUsers")
            .WithTags(UsersEndpointTags.Users);
    }
}
