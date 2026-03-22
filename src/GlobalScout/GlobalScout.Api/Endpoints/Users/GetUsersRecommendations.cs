using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Users;
using GlobalScout.Application.Users.Recommendations;
using GlobalScout.SharedKernel;

namespace GlobalScout.Api.Endpoints.Users;

internal sealed class GetUsersRecommendations : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet(
                UsersRoutes.Recommendations,
                async (
                    ClaimsPrincipal principal,
                    IQueryHandler<GetUserRecommendationsQuery, GetUserRecommendationsResult> handler,
                    int? limit,
                    CancellationToken cancellationToken) =>
                {
                    var userId = HttpUser.ResolveId(principal);
                    if (userId is null)
                    {
                        return Results.Unauthorized();
                    }

                    var role = HttpUser.ResolveRole(principal);
                    var query = new GetUserRecommendationsQuery(userId.Value, role, limit ?? 10);

                    var result = await handler.Handle(query, cancellationToken);

                    return result.Match(Results.Ok, CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("GetUsersRecommendations")
            .WithTags(UsersEndpointTags.Users);
    }
}
