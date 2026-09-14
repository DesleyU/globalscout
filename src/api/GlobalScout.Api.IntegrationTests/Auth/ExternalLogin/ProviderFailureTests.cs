using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace GlobalScout.Api.IntegrationTests.Auth.ExternalLogin;

[Collection(nameof(IntegrationCollection))]
public sealed class ProviderFailureTests
{
    private readonly IntegrationTestFixture _fixture;

    public ProviderFailureTests(IntegrationTestFixture fixture) => _fixture = fixture;

    private CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task Callback_returns_access_denied_when_consent_was_denied_and_persists_no_account()
    {
        // Nothing should ever call the fake accessor on this path - ExternalAuthenticationExtensions'
        // OnRemoteFailure redirects straight here with `remoteError=1` before any decision logic runs.
        var info = ExternalLoginIntegrationTestHelpers.GoogleInfo();
        var factory = _fixture.WithFakeExternalLogin(info);

        using var callback = await ExternalLoginIntegrationTestHelpers.CallbackWithRemoteErrorAsync(factory, Ct);
        Assert.Equal(HttpStatusCode.OK, callback.StatusCode);

        var error = await ExternalLoginIntegrationTestHelpers.ExtractFormFieldAsync(callback, "error", Ct);
        Assert.Equal("access_denied", error);

        var code = await ExternalLoginIntegrationTestHelpers.ExtractFormFieldAsync(callback, "code", Ct);
        Assert.Null(code);
    }

    [Fact]
    public async Task Callback_returns_404_for_an_unknown_provider()
    {
        var info = ExternalLoginIntegrationTestHelpers.GoogleInfo();
        var factory = _fixture.WithFakeExternalLogin(info);

        using var client = factory.CreateClient();
        using var response = await client.GetAsync("/api/auth/external/twitter/callback", Ct);
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Exchange_rejects_an_unknown_handoff_code()
    {
        var factory = _fixture.Factory;
        using var client = factory.CreateClient();
        using var response = await client.PostAsJsonAsync(
            "/api/auth/external/exchange",
            new { code = "not-a-real-code" },
            Ct);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Exchange_rejects_a_replayed_handoff_code()
    {
        var info = ExternalLoginIntegrationTestHelpers.GoogleInfo();
        var factory = _fixture.WithFakeExternalLogin(info);

        using var callback = await ExternalLoginIntegrationTestHelpers.CallbackAsync(factory, Ct);
        var code = await ExternalLoginIntegrationTestHelpers.ExtractFormFieldAsync(callback, "code", Ct);
        Assert.False(string.IsNullOrEmpty(code));

        using var first = factory.CreateClient();
        using var firstExchange = await first.PostAsJsonAsync("/api/auth/external/exchange", new { code }, Ct);
        firstExchange.EnsureSuccessStatusCode();

        using var second = factory.CreateClient();
        using var secondExchange = await second.PostAsJsonAsync("/api/auth/external/exchange", new { code }, Ct);
        Assert.Equal(HttpStatusCode.BadRequest, secondExchange.StatusCode);
    }
}
