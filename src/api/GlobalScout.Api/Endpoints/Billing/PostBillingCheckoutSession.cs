using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Billing;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Billing.CreateCheckoutSession;

namespace GlobalScout.Api.Endpoints.Billing;

internal sealed class PostBillingCheckoutSession : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost(
                BillingRoutes.CheckoutSession,
                async (
                    ClaimsPrincipal user,
                    ICommandHandler<CreateCheckoutSessionCommand, CreateCheckoutSessionResult> handler,
                    CancellationToken cancellationToken) =>
                {
                    var userId = HttpUser.ResolveId(user);
                    if (userId is null)
                    {
                        return Results.Unauthorized();
                    }

                    var result = await handler.Handle(new CreateCheckoutSessionCommand(userId.Value), cancellationToken);
                    return result.Match(
                        r => Results.Ok(new
                        {
                            success = true,
                            sessionId = r.SessionId,
                            url = r.Url
                        }),
                        CustomResults.Problem);
                })
            .RequireAuthorization()
            .WithName("PostBillingCheckoutSession")
            .WithTags(BillingEndpointTags.Billing);
    }
}
