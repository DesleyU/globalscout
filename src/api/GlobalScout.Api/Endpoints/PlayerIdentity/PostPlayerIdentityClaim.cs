using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.PlayerIdentity;
using GlobalScout.Application.PlayerIdentity.CreateClaim;

namespace GlobalScout.Api.Endpoints.PlayerIdentity;

internal sealed class PostPlayerIdentityClaim : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost(
                PlayerIdentityRoutes.Claims,
                async (
                    ClaimsPrincipal principal,
                    CreatePlayerIdentityClaimRequest request,
                    ICommandHandler<CreatePlayerIdentityClaimCommand, PlayerIdentityClaimDto> handler,
                    CancellationToken cancellationToken) =>
                {
                    if (HttpPlayer.RequirePlayer(principal, out var userId) is { } denied)
                    {
                        return denied;
                    }

                    var command = new CreatePlayerIdentityClaimCommand
                    {
                        UserId = userId,
                        ExternalPlayerId = request.ExternalPlayerId,
                        Provider = request.Provider,
                        FirstName = request.FirstName,
                        LastName = request.LastName,
                        DateOfBirth = request.DateOfBirth,
                        Nationality = request.Nationality,
                        CurrentCountry = request.CurrentCountry,
                        CurrentTeamId = request.CurrentTeamId,
                        CurrentClub = request.CurrentClub,
                        Position = request.Position,
                        PreviousClub = request.PreviousClub,
                        League = request.League
                    };

                    var result = await handler.Handle(command, cancellationToken);
                    return result.Match(Results.Ok, CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("PostPlayerIdentityClaim")
            .WithTags(PlayerIdentityEndpointTags.PlayerIdentity);
    }
}
