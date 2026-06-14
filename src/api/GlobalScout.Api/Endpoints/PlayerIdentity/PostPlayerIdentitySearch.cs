using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.PlayerIdentity;
using GlobalScout.Application.PlayerIdentity.SearchPlayers;

namespace GlobalScout.Api.Endpoints.PlayerIdentity;

internal sealed class PostPlayerIdentitySearch : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost(
                PlayerIdentityRoutes.Search,
                async (
                    ClaimsPrincipal principal,
                    PlayerIdentitySearchRequest request,
                    ICommandHandler<SearchPlayersCommand, SearchPlayersResult> handler,
                    CancellationToken cancellationToken) =>
                {
                    if (HttpPlayer.RequirePlayer(principal, out var userId) is { } denied)
                    {
                        return denied;
                    }

                    var command = new SearchPlayersCommand
                    {
                        UserId = userId,
                        FirstName = request.FirstName,
                        LastName = request.LastName,
                        DateOfBirth = request.DateOfBirth,
                        Nationality = request.Nationality,
                        CurrentCountry = request.CurrentCountry,
                        CurrentTeamId = request.CurrentTeamId,
                        CurrentTeamName = request.CurrentTeamName,
                        Position = request.Position,
                        PreviousClub = request.PreviousClub,
                        League = request.League
                    };

                    var result = await handler.Handle(command, cancellationToken);
                    return result.Match(Results.Ok, CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("PostPlayerIdentitySearch")
            .WithTags(PlayerIdentityEndpointTags.PlayerIdentity);
    }
}
