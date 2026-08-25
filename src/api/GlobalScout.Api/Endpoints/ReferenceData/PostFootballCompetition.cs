using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.ReferenceData;
using GlobalScout.Application.ReferenceData.SubmitCompetition;

namespace GlobalScout.Api.Endpoints.ReferenceData;

internal sealed class PostFootballCompetition : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost(
                ReferenceDataRoutes.Competitions,
                async (
                    ClaimsPrincipal principal,
                    SubmitFootballCompetitionRequest request,
                    ICommandHandler<SubmitFootballCompetitionCommand, FootballCompetitionDto> handler,
                    CancellationToken cancellationToken) =>
                {
                    var authError = HttpPlayer.RequirePlayer(principal, out var userId);
                    if (authError is not null)
                    {
                        return authError;
                    }

                    var result = await handler.Handle(
                        new SubmitFootballCompetitionCommand(
                            userId,
                            request.Country,
                            request.Name,
                            request.LevelHint,
                            request.TypeHint),
                        cancellationToken);

                    return result.Match(
                        competition => Results.Created(ReferenceDataRoutes.Competitions, competition),
                        CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("PostFootballCompetition")
            .WithTags(ReferenceDataEndpointTags.ReferenceData);
    }
}
