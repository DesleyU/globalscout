using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Social.Follow;
using GlobalScout.SharedKernel;

namespace GlobalScout.Api.Endpoints.Social.Follow;

internal sealed class DeleteFollowUnfollow : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapDelete(
                FollowRoutes.UnfollowUser,
                async (
                    ClaimsPrincipal user,
                    Guid userId,
                    ICommandHandler<UnfollowUserCommand, UnfollowUserResult> handler,
                    CancellationToken cancellationToken) =>
                {
                    var followerId = HttpUser.ResolveId(user);
                    if (followerId is null)
                    {
                        return Results.Unauthorized();
                    }

                    var command = new UnfollowUserCommand
                    {
                        FollowerId = followerId.Value,
                        FollowingUserId = userId
                    };

                    var result = await handler.Handle(command, cancellationToken);

                    return result.Match(
                        ok => Results.Ok(new { message = ok.Message }),
                        CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("DeleteFollowUnfollow")
            .WithTags(FollowEndpointTags.Follow);
    }
}
