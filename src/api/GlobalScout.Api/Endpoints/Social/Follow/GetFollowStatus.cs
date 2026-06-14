using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Social;
using GlobalScout.Application.Social.Follow.GetFollowStatus;
using GlobalScout.SharedKernel;

namespace GlobalScout.Api.Endpoints.Social.Follow;

internal sealed class GetFollowStatus : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet(
                FollowRoutes.Status,
                async (
                    ClaimsPrincipal user,
                    Guid userId,
                    IQueryHandler<GetFollowStatusQuery, GetFollowStatusResult> handler,
                    CancellationToken cancellationToken) =>
                {
                    var followerId = HttpUser.ResolveId(user);
                    if (followerId is null)
                    {
                        return Results.Unauthorized();
                    }

                    var query = new GetFollowStatusQuery(followerId.Value, userId);
                    var result = await handler.Handle(query, cancellationToken);

                    return result.Match(Results.Ok, CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("GetFollowStatus")
            .WithTags(FollowEndpointTags.Follow);
    }
}
