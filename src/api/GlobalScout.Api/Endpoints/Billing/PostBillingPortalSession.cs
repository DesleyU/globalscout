using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Billing;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Billing.CreatePortalSession;

namespace GlobalScout.Api.Endpoints.Billing;

internal sealed class PostBillingPortalSession : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost(
                BillingRoutes.PortalSession,
                async (
                    ClaimsPrincipal user,
                    ICommandHandler<CreateBillingPortalSessionCommand, CreateBillingPortalSessionResult> handler,
                    CancellationToken cancellationToken) =>
                {
                    var userId = HttpUser.ResolveId(user);
                    if (userId is null)
                    {
                        return Results.Unauthorized();
                    }

                    var result = await handler.Handle(
                        new CreateBillingPortalSessionCommand(userId.Value),
                        cancellationToken);
                    return result.Match(
                        r => Results.Ok(new
                        {
                            success = true,
                            url = r.Url
                        }),
                        CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("PostBillingPortalSession")
            .WithTags(BillingEndpointTags.Billing);
    }
}
