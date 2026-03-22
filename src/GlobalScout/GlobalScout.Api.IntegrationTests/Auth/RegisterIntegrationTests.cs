using System.Net;
using System.Net.Http.Json;
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
    public async Task Register_club_user_returns_created()
    {
        var body = new
        {
            email = $"club-{Guid.NewGuid():N}@example.com",
            password = "secret12",
            role = "CLUB",
            firstName = "Test",
            lastName = "Club",
            position = (string?)null,
            age = (int?)null,
            clubName = "Integration FC"
        };

        var response = await _client.PostAsJsonAsync("/api/auth/register", body, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }
}
