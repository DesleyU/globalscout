using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Authorization;
using GlobalScout.Application.ReferenceData.Admin.SyncCountry;

namespace GlobalScout.Api.Endpoints.Admin;

internal sealed class PostAdminReferenceDataSync : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost(
                AdminRoutes.ReferenceDataSync,
                async (
                    ClaimsPrincipal principal,
                    string countryCode,
                    ICommandHandler<SyncCountryReferenceDataCommand, SyncCountryReferenceDataResult> handler,
                    CancellationToken cancellationToken) =>
                {
                    var adminUserId = HttpUser.ResolveId(principal);
                    if (adminUserId is null)
                    {
                        return Results.Unauthorized();
                    }

                    var result = await handler.Handle(
                        new SyncCountryReferenceDataCommand(countryCode, adminUserId.Value),
                        cancellationToken);

                    return result.Match(Results.Ok, CustomResults.Problem);
                })
            .RequireAuthorization(AuthorizationPolicyNames.Admin)
            .WithName("AdminSyncCountryReferenceData")
            .WithTags(AdminEndpointTags.Admin);
    }
}
