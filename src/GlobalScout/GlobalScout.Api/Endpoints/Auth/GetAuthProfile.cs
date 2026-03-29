using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Auth.GetProfile;
using GlobalScout.SharedKernel;

namespace GlobalScout.Api.Endpoints.Auth;

internal sealed class GetAuthProfile : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet(
                AuthRoutes.Profile,
                async (
                    ClaimsPrincipal principal,
                    IQueryHandler<GetAuthProfileQuery, GetAuthProfileResult> handler,
                    CancellationToken cancellationToken) =>
                {
                    var userId = HttpUser.ResolveId(principal);
                    if (userId is null)
                    {
                        return Results.Unauthorized();
                    }

                    var result = await handler.Handle(new GetAuthProfileQuery(userId.Value), cancellationToken);

                    return result.Match(
                        r => Results.Ok(new
                        {
                            user = new
                            {
                                id = r.Id,
                                email = r.Email,
                                role = r.Role,
                                status = r.Status.ToString().ToUpperInvariant(),
                                accountType = r.AccountType.ToString().ToUpperInvariant(),
                                profile = r.Profile
                            }
                        }),
                        CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("GetAuthProfile")
            .WithTags(AuthEndpointTags.Authentication);
    }
}
