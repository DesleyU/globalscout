using System.Net.Http.Headers;
using System.Text.Json;
using GlobalScout.Domain.Identity;
using Xunit;

namespace GlobalScout.Api.IntegrationTests.Auth.ExternalLogin;

/// <summary>
/// User Story 2's actual job (per research.md's "Existing foundations discovered") is confirming an
/// OAuth-created account feeds the platform's *existing* onboarding/player-identity-claim funnel
/// identically to a password-created account - not building a parallel completion flow.
/// </summary>
[Collection(nameof(IntegrationCollection))]
public sealed class OnboardingHandoffTests
{
    private readonly IntegrationTestFixture _fixture;

    public OnboardingHandoffTests(IntegrationTestFixture fixture) => _fixture = fixture;

    private CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task OAuth_created_account_has_the_same_pending_profile_shape_as_a_password_account()
    {
        var email = $"external-{Guid.NewGuid():N}@example.com";
        var info = ExternalLoginIntegrationTestHelpers.GoogleInfo(email: email, firstName: "Pedri", lastName: "Gonzalez");
        var factory = _fixture.WithFakeExternalLogin(info);

        using var callback = await ExternalLoginIntegrationTestHelpers.CallbackAsync(factory, Ct);
        var code = await ExternalLoginIntegrationTestHelpers.ExtractFormFieldAsync(callback, "code", Ct);
        Assert.False(string.IsNullOrEmpty(code));

        var exchanged = await ExternalLoginIntegrationTestHelpers.ExchangeAsync(factory, code!, Ct);
        var token = exchanged.GetProperty("token").GetString();
        Assert.False(string.IsNullOrEmpty(token));

        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        using var profileResponse = await client.GetAsync("/api/auth/profile", Ct);
        profileResponse.EnsureSuccessStatusCode();

        await using var stream = await profileResponse.Content.ReadAsStreamAsync(Ct);
        var doc = await JsonDocument.ParseAsync(stream, cancellationToken: Ct);
        var user = doc.RootElement.GetProperty("user");

        // Same shape/role a password-registered PENDING account has - resolvePlayerOnboardingRedirect
        // and getPostAuthRedirect on the frontend need no branching for OAuth- vs password-originated
        // accounts (FR-006/FR-008).
        Assert.Equal(AppRoleNames.Pending, user.GetProperty("role").GetString());
        var profile = user.GetProperty("profile");
        Assert.Equal("Pedri", profile.GetProperty("firstName").GetString());
        Assert.Equal("Gonzalez", profile.GetProperty("lastName").GetString());
        Assert.True(profile.TryGetProperty("age", out var ageProp));
        Assert.Equal(JsonValueKind.Null, ageProp.ValueKind);
    }
}
