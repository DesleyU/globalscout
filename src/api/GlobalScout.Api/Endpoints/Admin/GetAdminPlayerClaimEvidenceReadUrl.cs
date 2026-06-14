using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Authorization;
using GlobalScout.Application.PlayerIdentity;
using GlobalScout.Application.PlayerIdentity.Admin.GetEvidenceReadUrl;

namespace GlobalScout.Api.Endpoints.Admin;

internal sealed class GetAdminPlayerClaimEvidenceReadUrl : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet(
                AdminRoutes.PlayerClaimEvidenceReadUrl,
                async (
                    Guid claimId,
                    Guid evidenceId,
                    IQueryHandler<GetAdminEvidenceReadUrlQuery, EvidenceReadUrlResult> handler,
                    CancellationToken cancellationToken) =>
                {
                    var result = await handler.Handle(
                        new GetAdminEvidenceReadUrlQuery(claimId, evidenceId),
                        cancellationToken);

                    return result.Match(Results.Ok, CustomResults.Problem);
                })
            .RequireAuthorization(AuthorizationPolicyNames.Admin)
            .WithName("AdminGetPlayerClaimEvidenceReadUrl")
            .WithTags(AdminEndpointTags.Admin);
    }
}
