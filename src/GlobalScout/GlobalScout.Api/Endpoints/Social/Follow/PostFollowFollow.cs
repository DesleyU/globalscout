using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Social;
using GlobalScout.Application.Social.Follow;
using GlobalScout.SharedKernel;

namespace GlobalScout.Api.Endpoints.Social.Follow;

internal sealed class PostFollowFollow : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost(
                FollowRoutes.FollowUser,
                async (
                    ClaimsPrincipal user,
                    Guid userId,
                    ICommandHandler<FollowUserCommand, FollowUserResponseDto> handler,
                    CancellationToken cancellationToken) =>
                {
                    var followerId = HttpUser.ResolveId(user);
                    if (followerId is null)
                    {
                        return Results.Unauthorized();
                    }

                    var command = new FollowUserCommand
                    {
                        FollowerId = followerId.Value,
                        FollowingUserId = userId
                    };

                    var result = await handler.Handle(command, cancellationToken);

                    return result.Match(
                        ok => Results.Ok(
                            new
                            {
                                message = "Successfully followed user",
                                follow = ok
                            }),
                        CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("PostFollowFollow")
            .WithTags(FollowEndpointTags.Follow);
    }
}
