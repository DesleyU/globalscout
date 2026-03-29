using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Social;
using GlobalScout.Application.Social.FollowLists;
using GlobalScout.SharedKernel;

namespace GlobalScout.Api.Endpoints.Social.Follow;

internal sealed class GetFollowStats : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet(
                FollowRoutes.Stats,
                async (
                    ClaimsPrincipal user,
                    Guid userId,
                    IQueryHandler<GetFollowStatsQuery, GetFollowStatsResult> handler,
                    CancellationToken cancellationToken) =>
                {
                    if (HttpUser.ResolveId(user) is null)
                    {
                        return Results.Unauthorized();
                    }

                    var query = new GetFollowStatsQuery(userId);
                    var result = await handler.Handle(query, cancellationToken);

                    return result.Match(Results.Ok, CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("GetFollowStats")
            .WithTags(FollowEndpointTags.Follow);
    }
}
