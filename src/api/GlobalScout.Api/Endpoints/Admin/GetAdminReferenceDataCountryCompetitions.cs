using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Authorization;
using GlobalScout.Application.ReferenceData.Admin.ListCountryCompetitions;

namespace GlobalScout.Api.Endpoints.Admin;

internal sealed class GetAdminReferenceDataCountryCompetitions : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet(
                AdminRoutes.ReferenceDataCountryCompetitions,
                async (
                    string countryCode,
                    IQueryHandler<ListAdminCountryCompetitionsQuery, ListAdminCountryCompetitionsResult> handler,
                    CancellationToken cancellationToken) =>
                {
                    var result = await handler.Handle(
                        new ListAdminCountryCompetitionsQuery(countryCode),
                        cancellationToken);

                    return result.Match(Results.Ok, CustomResults.Problem);
                })
            .RequireAuthorization(AuthorizationPolicyNames.Admin)
            .WithName("AdminListReferenceDataCountryCompetitions")
            .WithTags(AdminEndpointTags.Admin);
    }
}
