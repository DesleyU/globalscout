using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Social;
using GlobalScout.Application.Social.FollowLists;
using GlobalScout.SharedKernel;

namespace GlobalScout.Api.Endpoints.Social.Follow;

internal sealed class GetFollowFollowers : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet(
                FollowRoutes.Followers,
                async (
                    ClaimsPrincipal user,
                    Guid userId,
                    int? page,
                    int? limit,
                    IQueryHandler<GetFollowersQuery, GetFollowListResult> handler,
                    CancellationToken cancellationToken) =>
                {
                    if (HttpUser.ResolveId(user) is null)
                    {
                        return Results.Unauthorized();
                    }

                    var query = new GetFollowersQuery(userId, page ?? 1, limit ?? 20);
                    var result = await handler.Handle(query, cancellationToken);

                    return result.Match(
                        ok => Results.Ok(
                            new
                            {
                                followers = ok.Items,
                                pagination = ok.Pagination
                            }),
                        CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("GetFollowFollowers")
            .WithTags(FollowEndpointTags.Follow);
    }
}
