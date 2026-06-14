using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.ReferenceData;
using GlobalScout.Application.ReferenceData.SearchTeams;

namespace GlobalScout.Api.Endpoints.ReferenceData;

internal sealed class PostFootballTeamsSearch : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost(
                ReferenceDataRoutes.TeamsSearch,
                async (
                    SearchFootballTeamsRequest request,
                    IQueryHandler<SearchFootballTeamsQuery, SearchFootballTeamsResult> handler,
                    CancellationToken cancellationToken) =>
                {
                    var result = await handler.Handle(
                        new SearchFootballTeamsQuery(request.Country, request.SearchTerm),
                        cancellationToken);

                    return result.Match(Results.Ok, CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("PostFootballTeamsSearch")
            .WithTags(ReferenceDataEndpointTags.ReferenceData);
    }
}
