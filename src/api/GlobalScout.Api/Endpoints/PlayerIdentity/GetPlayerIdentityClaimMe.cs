using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.PlayerIdentity;
using GlobalScout.Application.PlayerIdentity.GetMyClaim;

namespace GlobalScout.Api.Endpoints.PlayerIdentity;

internal sealed class GetPlayerIdentityClaimMe : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet(
                PlayerIdentityRoutes.ClaimsMe,
                async (
                    ClaimsPrincipal principal,
                    IQueryHandler<GetMyPlayerIdentityClaimQuery, GetMyPlayerIdentityClaimResult> handler,
                    CancellationToken cancellationToken) =>
                {
                    if (HttpPlayer.RequirePlayer(principal, out var userId) is { } denied)
                    {
                        return denied;
                    }

                    var result = await handler.Handle(
                        new GetMyPlayerIdentityClaimQuery { UserId = userId },
                        cancellationToken);

                    return result.Match(Results.Ok, CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("GetPlayerIdentityClaimMe")
            .WithTags(PlayerIdentityEndpointTags.PlayerIdentity);
    }
}
