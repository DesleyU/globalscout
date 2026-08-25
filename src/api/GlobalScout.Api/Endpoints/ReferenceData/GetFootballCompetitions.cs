using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.ReferenceData;
using GlobalScout.Application.ReferenceData.ListCompetitions;
using GlobalScout.Domain.ReferenceData;

namespace GlobalScout.Api.Endpoints.ReferenceData;

internal sealed class GetFootballCompetitions : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet(
                ReferenceDataRoutes.Competitions,
                async (
                    string country,
                    CompetitionLevel? level,
                    IQueryHandler<ListFootballCompetitionsQuery, ListFootballCompetitionsResult> handler,
                    CancellationToken cancellationToken) =>
                {
                    var result = await handler.Handle(
                        new ListFootballCompetitionsQuery(country, level),
                        cancellationToken);

                    return result.Match(Results.Ok, CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("GetFootballCompetitions")
            .WithTags(ReferenceDataEndpointTags.ReferenceData);
    }
}
