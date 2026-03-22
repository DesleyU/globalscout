using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Users;
using GlobalScout.Application.Users.GetPublicProfile;
using GlobalScout.SharedKernel;

namespace GlobalScout.Api.Endpoints.Users;

internal sealed class GetUserById : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet(
                UsersRoutes.ById,
                async (
                    ClaimsPrincipal principal,
                    Guid id,
                    IQueryHandler<GetUserByPublicProfileQuery, GetUserByPublicProfileResult?> handler,
                    CancellationToken cancellationToken) =>
                {
                    var viewerId = HttpUser.ResolveId(principal);
                    if (viewerId is null)
                    {
                        return Results.Unauthorized();
                    }

                    var viewerRole = HttpUser.ResolveRole(principal);
                    var query = new GetUserByPublicProfileQuery(viewerId.Value, viewerRole, id);

                    var result = await handler.Handle(query, cancellationToken);

                    return result.Match(
                        r => r is null ? Results.NotFound() : Results.Ok(ToLegacyShape(r)),
                        CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("GetUserById")
            .WithTags(UsersEndpointTags.Users);
    }

    private static object ToLegacyShape(GetUserByPublicProfileResult result) =>
        new
        {
            user = new
            {
                id = result.User.Id,
                role = result.User.Role,
                accountType = result.User.AccountType,
                profile = result.User.Profile,
                subscriptionTier = result.User.SubscriptionTier
            }
        };
}
