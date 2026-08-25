using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.ReferenceData;
using GlobalScout.Application.ReferenceData.SearchCompetitions;

namespace GlobalScout.Api.Endpoints.ReferenceData;

internal sealed class PostFootballCompetitionsSearch : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost(
                ReferenceDataRoutes.CompetitionsSearch,
                async (
                    SearchFootballCompetitionsRequest request,
                    IQueryHandler<SearchFootballCompetitionsQuery, SearchFootballCompetitionsResult> handler,
                    CancellationToken cancellationToken) =>
                {
                    var result = await handler.Handle(
                        new SearchFootballCompetitionsQuery(
                            request.Country,
                            request.SearchTerm,
                            request.Level),
                        cancellationToken);

                    return result.Match(Results.Ok, CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("PostFootballCompetitionsSearch")
            .WithTags(ReferenceDataEndpointTags.ReferenceData);
    }
}
