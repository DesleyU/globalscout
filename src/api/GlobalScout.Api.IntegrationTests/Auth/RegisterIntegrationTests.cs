using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using GlobalScout.Domain.Identity;
using Xunit;

namespace GlobalScout.Api.IntegrationTests.Auth;

[Collection(nameof(IntegrationCollection))]
public sealed class RegisterIntegrationTests
{
    private readonly HttpClient _client;

    public RegisterIntegrationTests(IntegrationTestFixture fixture)
    {
        _client = fixture.Factory.CreateClient();
    }

    [Fact]
    public async Task Register_user_returns_created_with_pending_role()
    {
        var body = new
        {
            email = $"user-{Guid.NewGuid():N}@example.com",
            password = "secret12",
            firstName = "Test",
            lastName = "User",
        };

        var response = await _client.PostAsJsonAsync("/api/auth/register", body, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        await using var stream = await response.Content.ReadAsStreamAsync(TestContext.Current.CancellationToken);
        var doc = await JsonDocument.ParseAsync(stream, cancellationToken: TestContext.Current.CancellationToken);
        Assert.Equal(AppRoleNames.Pending, doc.RootElement.GetProperty("user").GetProperty("role").GetString());
    }
}
