using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.PlayerIdentity;
using GlobalScout.Application.PlayerIdentity.CreateSelfReportedClaim;

namespace GlobalScout.Api.Endpoints.PlayerIdentity;

internal sealed class PostPlayerIdentitySelfReportedClaim : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost(
                PlayerIdentityRoutes.ClaimsSelfReported,
                async (
                    ClaimsPrincipal principal,
                    CreateSelfReportedPlayerIdentityClaimRequest request,
                    ICommandHandler<CreateSelfReportedPlayerIdentityClaimCommand, PlayerIdentityClaimDto> handler,
                    CancellationToken cancellationToken) =>
                {
                    if (HttpPlayer.RequirePlayer(principal, out var userId) is { } denied)
                    {
                        return denied;
                    }

                    var command = new CreateSelfReportedPlayerIdentityClaimCommand
                    {
                        UserId = userId,
                        FirstName = request.FirstName,
                        LastName = request.LastName,
                        DateOfBirth = request.DateOfBirth,
                        Nationality = request.Nationality,
                        CurrentCountry = request.CurrentCountry,
                        CurrentClub = request.CurrentClub,
                        Position = request.Position,
                        PreviousClub = request.PreviousClub,
                        League = request.League,
                    };

                    var result = await handler.Handle(command, cancellationToken);
                    return result.Match(Results.Ok, CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("PostPlayerIdentitySelfReportedClaim")
            .WithTags(PlayerIdentityEndpointTags.PlayerIdentity);
    }
}
