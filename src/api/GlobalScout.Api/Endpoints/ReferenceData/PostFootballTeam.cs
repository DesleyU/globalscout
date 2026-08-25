using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.ReferenceData;
using GlobalScout.Application.ReferenceData.SubmitTeam;

namespace GlobalScout.Api.Endpoints.ReferenceData;

internal sealed class PostFootballTeam : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost(
                ReferenceDataRoutes.Teams,
                async (
                    ClaimsPrincipal principal,
                    SubmitFootballTeamRequest request,
                    ICommandHandler<SubmitFootballTeamCommand, FootballTeamDto> handler,
                    CancellationToken cancellationToken) =>
                {
                    var authError = HttpPlayer.RequirePlayer(principal, out var userId);
                    if (authError is not null)
                    {
                        return authError;
                    }

                    var result = await handler.Handle(
                        new SubmitFootballTeamCommand(
                            userId,
                            request.Country,
                            request.Name),
                        cancellationToken);

                    return result.Match(
                        team => Results.Created(ReferenceDataRoutes.Teams, team),
                        CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("PostFootballTeam")
            .WithTags(ReferenceDataEndpointTags.ReferenceData);
    }
}
