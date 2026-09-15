using System.Net;
using GlobalScout.Domain.Identity;
using Xunit;

namespace GlobalScout.Api.IntegrationTests.Auth.ExternalLogin;

[Collection(nameof(IntegrationCollection))]
public sealed class NewAccountCreationTests
{
    private readonly IntegrationTestFixture _fixture;

    public NewAccountCreationTests(IntegrationTestFixture fixture) => _fixture = fixture;

    private CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task Callback_with_no_existing_match_creates_pending_account_and_signs_in()
    {
        var email = $"external-{Guid.NewGuid():N}@example.com";
        var info = ExternalLoginIntegrationTestHelpers.GoogleInfo(email: email, firstName: "Pedri", lastName: "Gonzalez");
        var factory = _fixture.WithFakeExternalLogin(info);

        using var callback = await ExternalLoginIntegrationTestHelpers.CallbackAsync(factory, Ct);
        Assert.Equal(HttpStatusCode.OK, callback.StatusCode);

        var code = await ExternalLoginIntegrationTestHelpers.ExtractFormFieldAsync(callback, "code", Ct);
        Assert.False(string.IsNullOrEmpty(code));

        var exchanged = await ExternalLoginIntegrationTestHelpers.ExchangeAsync(factory, code!, Ct);
        Assert.False(string.IsNullOrEmpty(exchanged.GetProperty("token").GetString()));

        var user = exchanged.GetProperty("user");
        Assert.Equal(AppRoleNames.Pending, user.GetProperty("role").GetString());
        Assert.Equal(email, user.GetProperty("email").GetString());

        var profile = user.GetProperty("profile");
        Assert.Equal("Pedri", profile.GetProperty("firstName").GetString());
        Assert.Equal("Gonzalez", profile.GetProperty("lastName").GetString());

        var matches = await ExternalLoginIntegrationTestHelpers.CountUsersWithEmailAsync(factory, email, Ct);
        Assert.Equal(1, matches);
    }

    [Fact]
    public async Task Callback_succeeds_when_provider_omits_name()
    {
        var email = $"external-{Guid.NewGuid():N}@example.com";
        var info = ExternalLoginIntegrationTestHelpers.GoogleInfo(email: email, firstName: null!, lastName: null!);
        var factory = _fixture.WithFakeExternalLogin(info);

        using var callback = await ExternalLoginIntegrationTestHelpers.CallbackAsync(factory, Ct);
        var code = await ExternalLoginIntegrationTestHelpers.ExtractFormFieldAsync(callback, "code", Ct);
        Assert.False(string.IsNullOrEmpty(code));

        var exchanged = await ExternalLoginIntegrationTestHelpers.ExchangeAsync(factory, code!, Ct);
        var profile = exchanged.GetProperty("user").GetProperty("profile");
        Assert.Equal(string.Empty, profile.GetProperty("firstName").GetString());
        Assert.Equal(string.Empty, profile.GetProperty("lastName").GetString());
    }

    [Fact]
    public async Task Callback_with_provider_verified_email_creates_a_verified_account()
    {
        var email = $"external-{Guid.NewGuid():N}@example.com";
        var info = ExternalLoginIntegrationTestHelpers.GoogleInfo(email: email, emailVerified: true);
        var factory = _fixture.WithFakeExternalLogin(info);

        using var callback = await ExternalLoginIntegrationTestHelpers.CallbackAsync(factory, Ct);
        var code = await ExternalLoginIntegrationTestHelpers.ExtractFormFieldAsync(callback, "code", Ct);
        await ExternalLoginIntegrationTestHelpers.ExchangeAsync(factory, code!, Ct);

        // Unaffected by the email-verification feature (FR-011): OAuth2 accounts keep trusting the
        // provider's own assertion rather than going through the internal-account verification flow.
        Assert.True(await ExternalLoginIntegrationTestHelpers.IsEmailConfirmedAsync(factory, email, Ct));
    }

    [Fact]
    public async Task Callback_with_provider_unverified_email_creates_an_unverified_account()
    {
        var email = $"external-{Guid.NewGuid():N}@example.com";
        var info = ExternalLoginIntegrationTestHelpers.GoogleInfo(email: email, emailVerified: false);
        var factory = _fixture.WithFakeExternalLogin(info);

        using var callback = await ExternalLoginIntegrationTestHelpers.CallbackAsync(factory, Ct);
        var code = await ExternalLoginIntegrationTestHelpers.ExtractFormFieldAsync(callback, "code", Ct);
        await ExternalLoginIntegrationTestHelpers.ExchangeAsync(factory, code!, Ct);

        Assert.False(await ExternalLoginIntegrationTestHelpers.IsEmailConfirmedAsync(factory, email, Ct));
    }

    [Fact]
    public async Task Callback_succeeds_when_provider_omits_email()
    {
        var info = ExternalLoginIntegrationTestHelpers.GoogleInfo(email: null);
        var factory = _fixture.WithFakeExternalLogin(info);

        using var callback = await ExternalLoginIntegrationTestHelpers.CallbackAsync(factory, Ct);
        Assert.Equal(HttpStatusCode.OK, callback.StatusCode);

        var code = await ExternalLoginIntegrationTestHelpers.ExtractFormFieldAsync(callback, "code", Ct);
        Assert.False(string.IsNullOrEmpty(code));

        var exchanged = await ExternalLoginIntegrationTestHelpers.ExchangeAsync(factory, code!, Ct);
        Assert.Equal(AppRoleNames.Pending, exchanged.GetProperty("user").GetProperty("role").GetString());
    }
}
