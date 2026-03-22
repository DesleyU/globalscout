using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Users;
using GlobalScout.Application.Users.GetProfile;
using GlobalScout.SharedKernel;

namespace GlobalScout.Api.Endpoints.Users;

internal sealed class GetUsersProfile : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet(
                UsersRoutes.Profile,
                async (
                    ClaimsPrincipal user,
                    IQueryHandler<GetUsersProfileQuery, UsersFullProfileResult?> handler,
                    CancellationToken cancellationToken) =>
                {
                    var userId = HttpUser.ResolveId(user);
                    if (userId is null)
                    {
                        return Results.Unauthorized();
                    }

                    var result = await handler.Handle(new GetUsersProfileQuery(userId.Value), cancellationToken);

                    return result.Match(
                        u => u is null ? Results.NotFound() : Results.Ok(u),
                        CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("GetUsersProfile")
            .WithTags(UsersEndpointTags.Users);
    }
}
