using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.ReferenceData;
using GlobalScout.Application.ReferenceData.GetCountries;

namespace GlobalScout.Api.Endpoints.ReferenceData;

internal sealed class GetFootballCountries : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet(
                ReferenceDataRoutes.Countries,
                async (
                    IQueryHandler<GetFootballCountriesQuery, GetFootballCountriesResult> handler,
                    CancellationToken cancellationToken) =>
                {
                    var result = await handler.Handle(new GetFootballCountriesQuery(), cancellationToken);
                    return result.Match(Results.Ok, CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("GetFootballCountries")
            .WithTags(ReferenceDataEndpointTags.ReferenceData);
    }
}
