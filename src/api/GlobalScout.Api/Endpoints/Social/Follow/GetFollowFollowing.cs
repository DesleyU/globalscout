using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Social;
using GlobalScout.Application.Social.Follow.GetFollowing;
using GlobalScout.SharedKernel;

namespace GlobalScout.Api.Endpoints.Social.Follow;

internal sealed class GetFollowFollowing : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet(
                FollowRoutes.Following,
                async (
                    ClaimsPrincipal user,
                    Guid userId,
                    int? page,
                    int? limit,
                    IQueryHandler<GetFollowingQuery, GetFollowListResult> handler,
                    CancellationToken cancellationToken) =>
                {
                    if (HttpUser.ResolveId(user) is null)
                    {
                        return Results.Unauthorized();
                    }

                    var query = new GetFollowingQuery(userId, page ?? 1, limit ?? 20);
                    var result = await handler.Handle(query, cancellationToken);

                    return result.Match(
                        ok => Results.Ok(
                            new
                            {
                                following = ok.Items,
                                pagination = ok.Pagination
                            }),
                        CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("GetFollowFollowing")
            .WithTags(FollowEndpointTags.Follow);
    }
}
