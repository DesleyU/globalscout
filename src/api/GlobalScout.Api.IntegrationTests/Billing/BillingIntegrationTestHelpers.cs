using System.Globalization;
using System.Net.Http.Headers;
using System.Text;
using GlobalScout.Domain.Subscriptions;
using GlobalScout.Infrastructure.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace GlobalScout.Api.IntegrationTests.Billing;

/// <summary>Shared helpers for Stripe-webhook-backed billing integration tests.</summary>
internal static class BillingIntegrationTestHelpers
{
    public const string WebhookSecret = "integration_test_stripe_webhook_secret_ascii_key_123456";

    public static WebApplicationFactory<Program> CreateBillingFactory(
        IntegrationTestFixture fixture,
        Action<IWebHostBuilder>? extraConfigure = null) =>
        fixture.Factory.WithWebHostBuilder(b =>
        {
            b.ConfigureAppConfiguration((_, cfg) =>
            {
                cfg.AddInMemoryCollection(
                    new Dictionary<string, string?>
                    {
                        ["Stripe:WebhookSecret"] = WebhookSecret,
                        ["Stripe:SecretKey"] = "sk_test_integration_placeholder",
                        ["Stripe:PremiumPriceId"] = "price_test_placeholder"
                    });
            });

            extraConfigure?.Invoke(b);
        });

    public static async Task<HttpResponseMessage> PostSignedWebhookAsync(
        HttpClient client,
        string json,
        CancellationToken cancellationToken,
        string? webhookSecret = null,
        string? overrideSignatureHeader = null)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/billing/webhook")
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json")
        };

        if (overrideSignatureHeader is not null)
        {
            request.Headers.TryAddWithoutValidation("Stripe-Signature", overrideSignatureHeader);
        }
        else
        {
            var sig = StripeWebhookTestSigner.CreateSignatureHeader(webhookSecret ?? WebhookSecret, json);
            request.Headers.TryAddWithoutValidation("Stripe-Signature", sig);
        }

        return await client.SendAsync(request, cancellationToken);
    }

    public static string BuildCheckoutSessionCompletedJson(
        Guid userId,
        string eventId = "evt_checkout_1",
        string customerId = "cus_integration_test",
        string subscriptionId = "sub_integration_test",
        string mode = "subscription")
    {
        var uid = userId.ToString("D");
        return $$"""
            {
              "id": "{{eventId}}",
              "object": "event",
              "api_version": "2024-11-20.acacia",
              "created": 1710000000,
              "data": {
                "object": {
                  "id": "cs_integration_test",
                  "object": "checkout.session",
                  "mode": "{{mode}}",
                  "customer": "{{customerId}}",
                  "subscription": "{{subscriptionId}}",
                  "client_reference_id": "{{uid}}",
                  "metadata": { "user_id": "{{uid}}" }
                }
              },
              "livemode": false,
              "pending_webhooks": 0,
              "request": { "id": "req_integration_test", "idempotency_key": null },
              "type": "checkout.session.completed"
            }
            """;
    }

    public static string BuildCheckoutSessionCompletedJsonNoMetadata(string eventId = "evt_checkout_no_meta") =>
        $$"""
            {
              "id": "{{eventId}}",
              "object": "event",
              "api_version": "2024-11-20.acacia",
              "created": 1710000000,
              "data": {
                "object": {
                  "id": "cs_no_meta",
                  "object": "checkout.session",
                  "mode": "subscription",
                  "customer": "cus_no_meta",
                  "subscription": "sub_no_meta",
                  "client_reference_id": null,
                  "metadata": {}
                }
              },
              "livemode": false,
              "pending_webhooks": 0,
              "request": { "id": "req_no_meta", "idempotency_key": null },
              "type": "checkout.session.completed"
            }
            """;

    public static string BuildSubscriptionUpdatedJson(
        string subscriptionId,
        string customerId,
        string status,
        string eventId,
        DateTimeOffset? currentPeriodEnd = null)
    {
        // Stripe's JSON converter for current_period_end does not accept null; always emit a valid unix seconds value.
        var effectivePeriodEnd = currentPeriodEnd ?? DateTimeOffset.UtcNow.AddDays(30);
        var periodEndUnix = effectivePeriodEnd.ToUnixTimeSeconds().ToString(CultureInfo.InvariantCulture);

        return $$"""
            {
              "id": "{{eventId}}",
              "object": "event",
              "api_version": "2024-11-20.acacia",
              "created": 1710000100,
              "data": {
                "object": {
                  "id": "{{subscriptionId}}",
                  "object": "subscription",
                  "customer": "{{customerId}}",
                  "status": "{{status}}",
                  "items": {
                    "object": "list",
                    "data": [
                      {
                        "id": "si_1",
                        "object": "subscription_item",
                        "current_period_end": {{periodEndUnix}}
                      }
                    ]
                  }
                }
              },
              "livemode": false,
              "pending_webhooks": 0,
              "request": { "id": "req_sub_updated", "idempotency_key": null },
              "type": "customer.subscription.updated"
            }
            """;
    }

    public static string BuildSubscriptionDeletedJson(
        string subscriptionId,
        string customerId,
        string eventId) =>
        $$"""
            {
              "id": "{{eventId}}",
              "object": "event",
              "api_version": "2024-11-20.acacia",
              "created": 1710000200,
              "data": {
                "object": {
                  "id": "{{subscriptionId}}",
                  "object": "subscription",
                  "customer": "{{customerId}}",
                  "status": "canceled"
                }
              },
              "livemode": false,
              "pending_webhooks": 0,
              "request": { "id": "req_sub_deleted", "idempotency_key": null },
              "type": "customer.subscription.deleted"
            }
            """;

    public static string BuildInvoicePaymentFailedJson(
        string subscriptionId,
        string customerId,
        string eventId) =>
        $$"""
            {
              "id": "{{eventId}}",
              "object": "event",
              "api_version": "2024-11-20.acacia",
              "created": 1710000300,
              "data": {
                "object": {
                  "id": "in_failed_1",
                  "object": "invoice",
                  "customer": "{{customerId}}",
                  "parent": {
                    "type": "subscription_details",
                    "subscription_details": {
                      "subscription": "{{subscriptionId}}"
                    }
                  }
                }
              },
              "livemode": false,
              "pending_webhooks": 0,
              "request": { "id": "req_invoice_failed", "idempotency_key": null },
              "type": "invoice.payment_failed"
            }
            """;

    public static async Task<Subscription?> GetSubscriptionForUserAsync(
        WebApplicationFactory<Program> factory,
        Guid userId,
        CancellationToken cancellationToken)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<GlobalScoutDbContext>();
        return await db.Subscriptions.AsNoTracking().FirstOrDefaultAsync(s => s.UserId == userId, cancellationToken);
    }

    public static async Task<int> CountProcessedWebhookEventsAsync(
        WebApplicationFactory<Program> factory,
        string eventId,
        CancellationToken cancellationToken)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<GlobalScoutDbContext>();
        return await db.StripeProcessedWebhookEvents
            .AsNoTracking()
            .CountAsync(e => e.EventId == eventId, cancellationToken);
    }

    public static HttpClient CreateAuthenticatedClient(WebApplicationFactory<Program> factory, string token)
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }
}
