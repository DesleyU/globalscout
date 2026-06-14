using System.Text;
using GlobalScout.Api.Infrastructure;
using GlobalScout.Application.Abstractions.Billing;

namespace GlobalScout.Api.Endpoints.Billing;

internal sealed class PostBillingWebhook : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost(
                BillingRoutes.Webhook,
                async (HttpRequest request, IBillingWebhookProcessor processor, CancellationToken cancellationToken) =>
                {
                    using var reader = new StreamReader(request.Body, Encoding.UTF8);
                    var json = await reader.ReadToEndAsync(cancellationToken);

                    var signature = request.Headers.TryGetValue("Stripe-Signature", out var values)
                        ? values.ToString()
                        : string.Empty;

                    var result = await processor.ProcessAsync(json, signature, cancellationToken);
                    return result.Match(
                        () => Results.Ok(new { received = true }),
                        CustomResults.Problem);
                })
            .AllowAnonymous()
            .WithName("PostBillingWebhook")
            .WithTags(BillingEndpointTags.Billing);
    }
}
