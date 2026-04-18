using System.Net;
using System.Text;
using System.Text.Json;
using GlobalScout.Api.IntegrationTests.Social;
using GlobalScout.Domain.Subscriptions;
using Xunit;

namespace GlobalScout.Api.IntegrationTests.Billing;

[Collection(nameof(IntegrationCollection))]
public sealed class BillingIntegrationTests
{
    private readonly IntegrationTestFixture _fixture;

    public BillingIntegrationTests(IntegrationTestFixture fixture) => _fixture = fixture;

    private CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task Webhook_checkout_session_completed_promotes_user_to_premium()
    {
        var factory = BillingIntegrationTestHelpers.CreateBillingFactory(_fixture);
        var client = factory.CreateClient();
        var (userId, token) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(client, Ct);

        var json = BillingIntegrationTestHelpers.BuildCheckoutSessionCompletedJson(
            userId,
            eventId: "evt_integration_checkout_1");
        using var response = await BillingIntegrationTestHelpers.PostSignedWebhookAsync(client, json, Ct);
        response.EnsureSuccessStatusCode();

        using var authClient = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, token);
        using var infoResponse = await authClient.GetAsync("/api/account/info", Ct);
        infoResponse.EnsureSuccessStatusCode();
        await using var stream = await infoResponse.Content.ReadAsStreamAsync(Ct);
        var doc = await JsonDocument.ParseAsync(stream, cancellationToken: Ct);
        var data = doc.RootElement.GetProperty("data");
        Assert.Equal("PREMIUM", data.GetProperty("accountType").GetString());
    }

    [Fact]
    public async Task Webhook_rejects_invalid_signature()
    {
        var factory = BillingIntegrationTestHelpers.CreateBillingFactory(_fixture);
        var client = factory.CreateClient();
        var (userId, _) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(client, Ct);

        var json = BillingIntegrationTestHelpers.BuildCheckoutSessionCompletedJson(
            userId,
            eventId: "evt_integration_bad_sig");
        using var response = await BillingIntegrationTestHelpers.PostSignedWebhookAsync(
            client,
            json,
            Ct,
            overrideSignatureHeader: "t=1,v1=deadbeef");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Webhook_rejects_missing_signature_header()
    {
        var factory = BillingIntegrationTestHelpers.CreateBillingFactory(_fixture);
        var client = factory.CreateClient();
        var (userId, _) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(client, Ct);

        var json = BillingIntegrationTestHelpers.BuildCheckoutSessionCompletedJson(
            userId,
            eventId: "evt_integration_missing_sig");

        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/billing/webhook")
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json")
        };
        using var response = await client.SendAsync(request, Ct);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Webhook_checkout_session_completed_is_idempotent_on_replay()
    {
        var factory = BillingIntegrationTestHelpers.CreateBillingFactory(_fixture);
        var client = factory.CreateClient();
        var (userId, token) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(client, Ct);

        const string eventId = "evt_idempotent_1";
        var json = BillingIntegrationTestHelpers.BuildCheckoutSessionCompletedJson(
            userId,
            eventId: eventId,
            customerId: "cus_idem",
            subscriptionId: "sub_idem");

        using (var first = await BillingIntegrationTestHelpers.PostSignedWebhookAsync(client, json, Ct))
        {
            first.EnsureSuccessStatusCode();
        }

        using (var second = await BillingIntegrationTestHelpers.PostSignedWebhookAsync(client, json, Ct))
        {
            second.EnsureSuccessStatusCode();
        }

        using var authClient = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, token);
        using var infoResponse = await authClient.GetAsync("/api/account/info", Ct);
        infoResponse.EnsureSuccessStatusCode();
        await using var stream = await infoResponse.Content.ReadAsStreamAsync(Ct);
        var doc = await JsonDocument.ParseAsync(stream, cancellationToken: Ct);
        Assert.Equal("PREMIUM", doc.RootElement.GetProperty("data").GetProperty("accountType").GetString());

        var processedCount = await BillingIntegrationTestHelpers.CountProcessedWebhookEventsAsync(factory, eventId, Ct);
        Assert.Equal(1, processedCount);

        var sub = await BillingIntegrationTestHelpers.GetSubscriptionForUserAsync(factory, userId, Ct);
        Assert.NotNull(sub);
        Assert.Equal("sub_idem", sub!.StripeSubscriptionId);
        Assert.Equal(SubscriptionTier.Premium, sub.Tier);
        Assert.Equal(SubscriptionStatus.Active, sub.Status);
    }

    [Fact]
    public async Task Webhook_customer_subscription_updated_past_due_marks_past_due_and_keeps_premium()
    {
        var factory = BillingIntegrationTestHelpers.CreateBillingFactory(_fixture);
        var client = factory.CreateClient();
        var (userId, token) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(client, Ct);

        const string customerId = "cus_past_due";
        const string subscriptionId = "sub_past_due";

        var checkoutJson = BillingIntegrationTestHelpers.BuildCheckoutSessionCompletedJson(
            userId,
            eventId: "evt_pd_checkout",
            customerId: customerId,
            subscriptionId: subscriptionId);
        using (var r = await BillingIntegrationTestHelpers.PostSignedWebhookAsync(client, checkoutJson, Ct))
        {
            r.EnsureSuccessStatusCode();
        }

        var periodEnd = DateTimeOffset.UtcNow.AddDays(7);
        var updatedJson = BillingIntegrationTestHelpers.BuildSubscriptionUpdatedJson(
            subscriptionId,
            customerId,
            "past_due",
            eventId: "evt_pd_updated",
            currentPeriodEnd: periodEnd);
        using (var r = await BillingIntegrationTestHelpers.PostSignedWebhookAsync(client, updatedJson, Ct))
        {
            r.EnsureSuccessStatusCode();
        }

        var sub = await BillingIntegrationTestHelpers.GetSubscriptionForUserAsync(factory, userId, Ct);
        Assert.NotNull(sub);
        Assert.Equal(SubscriptionTier.Premium, sub!.Tier);
        Assert.Equal(SubscriptionStatus.PastDue, sub.Status);
        Assert.NotNull(sub.EndDate);

        using var authClient = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, token);
        using var infoResponse = await authClient.GetAsync("/api/account/info", Ct);
        infoResponse.EnsureSuccessStatusCode();
        await using var stream = await infoResponse.Content.ReadAsStreamAsync(Ct);
        var doc = await JsonDocument.ParseAsync(stream, cancellationToken: Ct);
        Assert.Equal("PREMIUM", doc.RootElement.GetProperty("data").GetProperty("accountType").GetString());
    }

    [Fact]
    public async Task Webhook_customer_subscription_updated_canceled_downgrades_to_basic()
    {
        var factory = BillingIntegrationTestHelpers.CreateBillingFactory(_fixture);
        var client = factory.CreateClient();
        var (userId, token) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(client, Ct);

        const string customerId = "cus_cancel_update";
        const string subscriptionId = "sub_cancel_update";

        var checkoutJson = BillingIntegrationTestHelpers.BuildCheckoutSessionCompletedJson(
            userId,
            eventId: "evt_cancel_checkout",
            customerId: customerId,
            subscriptionId: subscriptionId);
        using (var r = await BillingIntegrationTestHelpers.PostSignedWebhookAsync(client, checkoutJson, Ct))
        {
            r.EnsureSuccessStatusCode();
        }

        var updatedJson = BillingIntegrationTestHelpers.BuildSubscriptionUpdatedJson(
            subscriptionId,
            customerId,
            "canceled",
            eventId: "evt_cancel_updated");
        using (var r = await BillingIntegrationTestHelpers.PostSignedWebhookAsync(client, updatedJson, Ct))
        {
            r.EnsureSuccessStatusCode();
        }

        var sub = await BillingIntegrationTestHelpers.GetSubscriptionForUserAsync(factory, userId, Ct);
        Assert.NotNull(sub);
        Assert.Equal(SubscriptionTier.Basic, sub!.Tier);
        Assert.Equal(SubscriptionStatus.Cancelled, sub.Status);

        using var authClient = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, token);
        using var infoResponse = await authClient.GetAsync("/api/account/info", Ct);
        infoResponse.EnsureSuccessStatusCode();
        await using var stream = await infoResponse.Content.ReadAsStreamAsync(Ct);
        var doc = await JsonDocument.ParseAsync(stream, cancellationToken: Ct);
        Assert.Equal("BASIC", doc.RootElement.GetProperty("data").GetProperty("accountType").GetString());
    }

    [Fact]
    public async Task Webhook_customer_subscription_deleted_revokes_premium()
    {
        var factory = BillingIntegrationTestHelpers.CreateBillingFactory(_fixture);
        var client = factory.CreateClient();
        var (userId, token) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(client, Ct);

        const string customerId = "cus_deleted";
        const string subscriptionId = "sub_deleted";

        var checkoutJson = BillingIntegrationTestHelpers.BuildCheckoutSessionCompletedJson(
            userId,
            eventId: "evt_del_checkout",
            customerId: customerId,
            subscriptionId: subscriptionId);
        using (var r = await BillingIntegrationTestHelpers.PostSignedWebhookAsync(client, checkoutJson, Ct))
        {
            r.EnsureSuccessStatusCode();
        }

        var deletedJson = BillingIntegrationTestHelpers.BuildSubscriptionDeletedJson(
            subscriptionId,
            customerId,
            eventId: "evt_del_deleted");
        using (var r = await BillingIntegrationTestHelpers.PostSignedWebhookAsync(client, deletedJson, Ct))
        {
            r.EnsureSuccessStatusCode();
        }

        var sub = await BillingIntegrationTestHelpers.GetSubscriptionForUserAsync(factory, userId, Ct);
        Assert.NotNull(sub);
        Assert.Equal(SubscriptionTier.Basic, sub!.Tier);
        Assert.Equal(SubscriptionStatus.Cancelled, sub.Status);
        Assert.NotNull(sub.EndDate);

        using var authClient = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, token);
        using var infoResponse = await authClient.GetAsync("/api/account/info", Ct);
        infoResponse.EnsureSuccessStatusCode();
        await using var stream = await infoResponse.Content.ReadAsStreamAsync(Ct);
        var doc = await JsonDocument.ParseAsync(stream, cancellationToken: Ct);
        Assert.Equal("BASIC", doc.RootElement.GetProperty("data").GetProperty("accountType").GetString());
    }

    [Fact]
    public async Task Webhook_invoice_payment_failed_marks_subscription_past_due()
    {
        var factory = BillingIntegrationTestHelpers.CreateBillingFactory(_fixture);
        var client = factory.CreateClient();
        var (userId, _) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(client, Ct);

        const string customerId = "cus_inv_failed";
        const string subscriptionId = "sub_inv_failed";

        var checkoutJson = BillingIntegrationTestHelpers.BuildCheckoutSessionCompletedJson(
            userId,
            eventId: "evt_inv_checkout",
            customerId: customerId,
            subscriptionId: subscriptionId);
        using (var r = await BillingIntegrationTestHelpers.PostSignedWebhookAsync(client, checkoutJson, Ct))
        {
            r.EnsureSuccessStatusCode();
        }

        var invoiceJson = BillingIntegrationTestHelpers.BuildInvoicePaymentFailedJson(
            subscriptionId,
            customerId,
            eventId: "evt_inv_failed");
        using (var r = await BillingIntegrationTestHelpers.PostSignedWebhookAsync(client, invoiceJson, Ct))
        {
            r.EnsureSuccessStatusCode();
        }

        var sub = await BillingIntegrationTestHelpers.GetSubscriptionForUserAsync(factory, userId, Ct);
        Assert.NotNull(sub);
        Assert.Equal(SubscriptionStatus.PastDue, sub!.Status);
    }

    [Fact]
    public async Task Webhook_checkout_session_completed_non_subscription_mode_is_ignored()
    {
        var factory = BillingIntegrationTestHelpers.CreateBillingFactory(_fixture);
        var client = factory.CreateClient();
        var (userId, token) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(client, Ct);

        var json = BillingIntegrationTestHelpers.BuildCheckoutSessionCompletedJson(
            userId,
            eventId: "evt_non_sub_mode",
            mode: "payment");
        using var response = await BillingIntegrationTestHelpers.PostSignedWebhookAsync(client, json, Ct);
        response.EnsureSuccessStatusCode();

        var sub = await BillingIntegrationTestHelpers.GetSubscriptionForUserAsync(factory, userId, Ct);
        Assert.Null(sub);

        using var authClient = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, token);
        using var infoResponse = await authClient.GetAsync("/api/account/info", Ct);
        infoResponse.EnsureSuccessStatusCode();
        await using var stream = await infoResponse.Content.ReadAsStreamAsync(Ct);
        var doc = await JsonDocument.ParseAsync(stream, cancellationToken: Ct);
        Assert.Equal("BASIC", doc.RootElement.GetProperty("data").GetProperty("accountType").GetString());
    }

    [Fact]
    public async Task Webhook_checkout_session_completed_missing_user_id_is_ignored()
    {
        var factory = BillingIntegrationTestHelpers.CreateBillingFactory(_fixture);
        var client = factory.CreateClient();
        var (userId, token) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(client, Ct);

        var json = BillingIntegrationTestHelpers.BuildCheckoutSessionCompletedJsonNoMetadata();
        using var response = await BillingIntegrationTestHelpers.PostSignedWebhookAsync(client, json, Ct);
        response.EnsureSuccessStatusCode();

        var sub = await BillingIntegrationTestHelpers.GetSubscriptionForUserAsync(factory, userId, Ct);
        Assert.Null(sub);

        using var authClient = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, token);
        using var infoResponse = await authClient.GetAsync("/api/account/info", Ct);
        infoResponse.EnsureSuccessStatusCode();
        await using var stream = await infoResponse.Content.ReadAsStreamAsync(Ct);
        var doc = await JsonDocument.ParseAsync(stream, cancellationToken: Ct);
        Assert.Equal("BASIC", doc.RootElement.GetProperty("data").GetProperty("accountType").GetString());
    }
}
