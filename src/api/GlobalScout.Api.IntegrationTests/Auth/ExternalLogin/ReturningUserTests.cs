using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace GlobalScout.Api.IntegrationTests.Auth.ExternalLogin;

[Collection(nameof(IntegrationCollection))]
public sealed class ReturningUserTests
{
    private readonly IntegrationTestFixture _fixture;

    public ReturningUserTests(IntegrationTestFixture fixture) => _fixture = fixture;

    private CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task Second_callback_with_same_provider_key_signs_into_the_same_account_not_a_duplicate()
    {
        var email = $"external-{Guid.NewGuid():N}@example.com";
        var providerKey = $"google-{Guid.NewGuid():N}";
        var info = ExternalLoginIntegrationTestHelpers.GoogleInfo(email: email, providerKey: providerKey);
        var factory = _fixture.WithFakeExternalLogin(info);

        var firstUserId = await CompleteCallbackAndGetUserIdAsync(factory);
        var secondUserId = await CompleteCallbackAndGetUserIdAsync(factory);

        Assert.Equal(firstUserId, secondUserId);

        var matches = await ExternalLoginIntegrationTestHelpers.CountUsersWithEmailAsync(factory, email, Ct);
        Assert.Equal(1, matches);
    }

    [Fact]
    public async Task Verified_email_matching_an_existing_password_account_auto_links_instead_of_duplicating()
    {
        var email = $"external-{Guid.NewGuid():N}@example.com";
        var existingUserId = await RegisterPasswordUserAsync(email);

        var info = ExternalLoginIntegrationTestHelpers.GoogleInfo(email: email, emailVerified: true);
        var factory = _fixture.WithFakeExternalLogin(info);

        using var callback = await ExternalLoginIntegrationTestHelpers.CallbackAsync(factory, Ct);
        var code = await ExternalLoginIntegrationTestHelpers.ExtractFormFieldAsync(callback, "code", Ct);
        Assert.False(string.IsNullOrEmpty(code));

        var exchanged = await ExternalLoginIntegrationTestHelpers.ExchangeAsync(factory, code!, Ct);
        var linkedUserId = exchanged.GetProperty("user").GetProperty("id").GetGuid();

        Assert.Equal(existingUserId, linkedUserId);

        var matches = await ExternalLoginIntegrationTestHelpers.CountUsersWithEmailAsync(factory, email, Ct);
        Assert.Equal(1, matches);

        var logins = await ExternalLoginIntegrationTestHelpers.CountLoginsAsync(factory, existingUserId, Ct);
        Assert.Equal(1, logins);
    }

    [Fact]
    public async Task Unverified_email_matching_an_existing_account_is_rejected_without_linking()
    {
        var email = $"external-{Guid.NewGuid():N}@example.com";
        var existingUserId = await RegisterPasswordUserAsync(email);

        var info = ExternalLoginIntegrationTestHelpers.GoogleInfo(email: email, emailVerified: false);
        var factory = _fixture.WithFakeExternalLogin(info);

        using var callback = await ExternalLoginIntegrationTestHelpers.CallbackAsync(factory, Ct);
        var error = await ExternalLoginIntegrationTestHelpers.ExtractFormFieldAsync(callback, "error", Ct);
        Assert.Equal("email_in_use", error);

        var code = await ExternalLoginIntegrationTestHelpers.ExtractFormFieldAsync(callback, "code", Ct);
        Assert.Null(code);

        var logins = await ExternalLoginIntegrationTestHelpers.CountLoginsAsync(factory, existingUserId, Ct);
        Assert.Equal(0, logins);
    }

    private async Task<Guid> CompleteCallbackAndGetUserIdAsync(
        Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory<Program> factory)
    {
        using var callback = await ExternalLoginIntegrationTestHelpers.CallbackAsync(factory, Ct);
        var code = await ExternalLoginIntegrationTestHelpers.ExtractFormFieldAsync(callback, "code", Ct);
        Assert.False(string.IsNullOrEmpty(code));

        var exchanged = await ExternalLoginIntegrationTestHelpers.ExchangeAsync(factory, code!, Ct);
        return exchanged.GetProperty("user").GetProperty("id").GetGuid();
    }

    /// <summary>Registers a password account (via the existing POST /api/auth/register) at a caller-chosen
    /// email, so a subsequent external-login callback can be pointed at the same address (FR-010).</summary>
    private async Task<Guid> RegisterPasswordUserAsync(string email)
    {
        using var client = _fixture.Factory.CreateClient();
        using var response = await client.PostAsJsonAsync(
            "/api/auth/register",
            new
            {
                email,
                password = "secret12",
                firstName = "Existing",
                lastName = "User",
            },
            Ct);

        response.EnsureSuccessStatusCode();
        await using var stream = await response.Content.ReadAsStreamAsync(Ct);
        var doc = await JsonDocument.ParseAsync(stream, cancellationToken: Ct);
        return doc.RootElement.GetProperty("user").GetProperty("id").GetGuid();
    }
}
