using System.Net;
using Xunit;

namespace GlobalScout.Api.IntegrationTests.Auth.ExternalLogin;

[Collection(nameof(IntegrationCollection))]
public sealed class AgeGateTests
{
    private readonly IntegrationTestFixture _fixture;

    public AgeGateTests(IntegrationTestFixture fixture) => _fixture = fixture;

    private CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task Callback_blocks_account_creation_when_provider_reports_under_16_birthdate()
    {
        var email = $"external-{Guid.NewGuid():N}@example.com";
        var underage = DateOnly.FromDateTime(DateTime.UtcNow.AddYears(-10));
        var info = ExternalLoginIntegrationTestHelpers.GoogleInfo(email: email, dateOfBirth: underage);
        var factory = _fixture.WithFakeExternalLogin(info);

        using var callback = await ExternalLoginIntegrationTestHelpers.CallbackAsync(factory, Ct);
        Assert.Equal(HttpStatusCode.OK, callback.StatusCode);

        var error = await ExternalLoginIntegrationTestHelpers.ExtractFormFieldAsync(callback, "error", Ct);
        Assert.Equal("under_age", error);

        var code = await ExternalLoginIntegrationTestHelpers.ExtractFormFieldAsync(callback, "code", Ct);
        Assert.Null(code);

        var matches = await ExternalLoginIntegrationTestHelpers.CountUsersWithEmailAsync(factory, email, Ct);
        Assert.Equal(0, matches);
    }

    [Fact]
    public async Task Callback_blocks_account_creation_when_provider_reports_under_16_age()
    {
        var email = $"external-{Guid.NewGuid():N}@example.com";
        var info = ExternalLoginIntegrationTestHelpers.GoogleInfo(email: email, age: 12);
        var factory = _fixture.WithFakeExternalLogin(info);

        using var callback = await ExternalLoginIntegrationTestHelpers.CallbackAsync(factory, Ct);
        var error = await ExternalLoginIntegrationTestHelpers.ExtractFormFieldAsync(callback, "error", Ct);
        Assert.Equal("under_age", error);

        var matches = await ExternalLoginIntegrationTestHelpers.CountUsersWithEmailAsync(factory, email, Ct);
        Assert.Equal(0, matches);
    }
}
