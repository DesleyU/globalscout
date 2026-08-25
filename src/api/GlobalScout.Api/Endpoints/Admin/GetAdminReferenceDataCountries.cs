using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Authorization;
using GlobalScout.Application.ReferenceData.Admin.ListCountries;

namespace GlobalScout.Api.Endpoints.Admin;

internal sealed class GetAdminReferenceDataCountries : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet(
                AdminRoutes.ReferenceDataCountries,
                async (
                    IQueryHandler<ListAdminReferenceDataCountriesQuery, ListAdminReferenceDataCountriesResult> handler,
                    CancellationToken cancellationToken) =>
                {
                    var result = await handler.Handle(
                        new ListAdminReferenceDataCountriesQuery(),
                        cancellationToken);

                    return result.Match(Results.Ok, CustomResults.Problem);
                })
            .RequireAuthorization(AuthorizationPolicyNames.Admin)
            .WithName("AdminListReferenceDataCountries")
            .WithTags(AdminEndpointTags.Admin);
    }
}
