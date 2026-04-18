using System.Net;
using System.Text.Json;
using GlobalScout.Api.IntegrationTests.Social;
using GlobalScout.Api.IntegrationTests.Stats;
using GlobalScout.Application.Abstractions.Billing;
using GlobalScout.Domain.Identity;
using GlobalScout.SharedKernel;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Xunit;

namespace GlobalScout.Api.IntegrationTests.Billing;

[Collection(nameof(IntegrationCollection))]
public sealed class BillingEndpointsIntegrationTests
{
    private readonly IntegrationTestFixture _fixture;

    public BillingEndpointsIntegrationTests(IntegrationTestFixture fixture) => _fixture = fixture;

    private CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task Post_checkout_session_without_token_returns_401()
    {
        var factory = BillingIntegrationTestHelpers.CreateBillingFactory(_fixture);
        using var client = factory.CreateClient();
        using var response = await client.PostAsync("/api/billing/checkout-session", content: null, Ct);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Post_checkout_session_for_premium_user_returns_already_premium()
    {
        const string stubbedUrl = "https://checkout.stripe.test/unreachable";
        var factory = BillingIntegrationTestHelpers.CreateBillingFactory(
            _fixture,
            b => b.ConfigureTestServices(services =>
            {
                services.RemoveAll<IBillingCheckoutService>();
                services.AddScoped<IBillingCheckoutService>(_ =>
                    new StubBillingCheckoutService(stubbedUrl));
            }));

        var (userId, token) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory.CreateClient(), Ct);
        await StatsIntegrationTestHelpers.SetAccountTypeAsync(factory, userId, AccountType.Premium, Ct);

        using var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, token);
        using var response = await client.PostAsync("/api/billing/checkout-session", content: null, Ct);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        await using var stream = await response.Content.ReadAsStreamAsync(Ct);
        var doc = await JsonDocument.ParseAsync(stream, cancellationToken: Ct);
        Assert.Equal("Billing.AlreadyPremium", doc.RootElement.GetProperty("code").GetString());
    }

    [Fact]
    public async Task Post_checkout_session_for_basic_user_returns_url_from_checkout_service()
    {
        const string stubbedUrl = "https://checkout.stripe.test/session";
        const string stubbedSessionId = "cs_test_stubbed";
        var factory = BillingIntegrationTestHelpers.CreateBillingFactory(
            _fixture,
            b => b.ConfigureTestServices(services =>
            {
                services.RemoveAll<IBillingCheckoutService>();
                services.AddScoped<IBillingCheckoutService>(_ =>
                    new StubBillingCheckoutService(stubbedUrl, stubbedSessionId));
            }));

        var (_, token) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory.CreateClient(), Ct);
        using var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, token);

        using var response = await client.PostAsync("/api/billing/checkout-session", content: null, Ct);
        response.EnsureSuccessStatusCode();

        await using var stream = await response.Content.ReadAsStreamAsync(Ct);
        var doc = await JsonDocument.ParseAsync(stream, cancellationToken: Ct);
        var root = doc.RootElement;
        Assert.True(root.GetProperty("success").GetBoolean());
        Assert.Equal(stubbedSessionId, root.GetProperty("sessionId").GetString());
        Assert.Equal(stubbedUrl, root.GetProperty("url").GetString());
    }

    [Fact]
    public async Task Post_portal_session_without_token_returns_401()
    {
        var factory = BillingIntegrationTestHelpers.CreateBillingFactory(_fixture);
        using var client = factory.CreateClient();
        using var response = await client.PostAsync("/api/billing/portal-session", content: null, Ct);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Post_portal_session_without_stripe_customer_id_returns_no_stripe_customer()
    {
        var factory = BillingIntegrationTestHelpers.CreateBillingFactory(
            _fixture,
            b => b.ConfigureTestServices(services =>
            {
                services.RemoveAll<IBillingPortalService>();
                services.AddScoped<IBillingPortalService>(_ =>
                    new StubBillingPortalService("https://billing.stripe.test/portal"));
            }));

        var (_, token) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory.CreateClient(), Ct);
        using var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, token);
        using var response = await client.PostAsync("/api/billing/portal-session", content: null, Ct);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        await using var stream = await response.Content.ReadAsStreamAsync(Ct);
        var doc = await JsonDocument.ParseAsync(stream, cancellationToken: Ct);
        Assert.Equal("Billing.NoStripeCustomer", doc.RootElement.GetProperty("code").GetString());
    }

    [Fact]
    public async Task Post_portal_session_after_checkout_returns_url()
    {
        const string stubbedPortalUrl = "https://billing.stripe.test/portal/session";
        var factory = BillingIntegrationTestHelpers.CreateBillingFactory(
            _fixture,
            b => b.ConfigureTestServices(services =>
            {
                services.RemoveAll<IBillingPortalService>();
                services.AddScoped<IBillingPortalService>(_ =>
                    new StubBillingPortalService(stubbedPortalUrl));
            }));

        var anonClient = factory.CreateClient();
        var (userId, token) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(anonClient, Ct);

        var checkoutJson = BillingIntegrationTestHelpers.BuildCheckoutSessionCompletedJson(
            userId,
            eventId: "evt_portal_checkout",
            customerId: "cus_for_portal",
            subscriptionId: "sub_for_portal");
        using (var r = await BillingIntegrationTestHelpers.PostSignedWebhookAsync(anonClient, checkoutJson, Ct))
        {
            r.EnsureSuccessStatusCode();
        }

        using var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, token);
        using var response = await client.PostAsync("/api/billing/portal-session", content: null, Ct);
        response.EnsureSuccessStatusCode();

        await using var stream = await response.Content.ReadAsStreamAsync(Ct);
        var doc = await JsonDocument.ParseAsync(stream, cancellationToken: Ct);
        var root = doc.RootElement;
        Assert.True(root.GetProperty("success").GetBoolean());
        Assert.Equal(stubbedPortalUrl, root.GetProperty("url").GetString());
    }

    private sealed class StubBillingCheckoutService(string url, string sessionId = "cs_stub") : IBillingCheckoutService
    {
        public Task<Result<CreateCheckoutSessionResult>> CreatePremiumSubscriptionCheckoutAsync(
            Guid userId,
            string email,
            CancellationToken cancellationToken) =>
            Task.FromResult(Result.Success(new CreateCheckoutSessionResult(sessionId, url)));
    }

    private sealed class StubBillingPortalService(string url) : IBillingPortalService
    {
        public Task<Result<CreateBillingPortalSessionResult>> CreateCustomerPortalSessionAsync(
            string stripeCustomerId,
            CancellationToken cancellationToken) =>
            Task.FromResult(Result.Success(new CreateBillingPortalSessionResult(url)));
    }
}
