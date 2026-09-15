using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using GlobalScout.Infrastructure.Auth.Email;
using GlobalScout.Infrastructure.Data;
using GlobalScout.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace GlobalScout.Api.IntegrationTests.Auth;

/// <summary>
/// Exercises the real HTTP endpoints against real Postgres and ASP.NET Core Identity token
/// generation/validation (Constitution Principle II). Tokens are generated directly via
/// <see cref="UserManager{TUser}.GenerateEmailConfirmationTokenAsync"/> (resolved from the test
/// host's DI container) rather than parsed out of a "sent" email: Ministack's SES emulation has no
/// confirmed message-retrieval API (see research.md §1), so these tests validate this feature's own
/// verify/resend logic rather than depending on an unverified mock-API shape for message capture.
/// </summary>
[Collection(nameof(IntegrationCollection))]
public sealed class EmailVerificationIntegrationTests
{
    private readonly IntegrationTestFixture _fixture;
    private readonly HttpClient _client;

    public EmailVerificationIntegrationTests(IntegrationTestFixture fixture)
    {
        _fixture = fixture;
        _client = fixture.Factory.CreateClient();
    }

    [Fact]
    public async Task Register_creates_an_unverified_account()
    {
        var cancellationToken = TestContext.Current.CancellationToken;
        var (userId, _) = await RegisterAsync($"verify-{Guid.NewGuid():N}@example.com", cancellationToken);

        Assert.False(await IsEmailConfirmedAsync(userId, cancellationToken));
    }

    [Fact]
    public async Task Verify_email_with_a_valid_token_marks_the_account_verified()
    {
        var cancellationToken = TestContext.Current.CancellationToken;
        var (userId, _) = await RegisterAsync($"verify-{Guid.NewGuid():N}@example.com", cancellationToken);
        var token = await GenerateEncodedTokenAsync(userId, cancellationToken);

        var response = await _client.PostAsJsonAsync("/api/auth/verify-email", new { token }, cancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.True(await IsEmailConfirmedAsync(userId, cancellationToken));
    }

    [Fact]
    public async Task Verify_email_a_second_time_reports_already_verified_without_an_error()
    {
        var cancellationToken = TestContext.Current.CancellationToken;
        var userId = await RegisterAsync($"verify-{Guid.NewGuid():N}@example.com", cancellationToken);
        var token = await GenerateEncodedTokenAsync(userId.UserId, cancellationToken);
        (await _client.PostAsJsonAsync("/api/auth/verify-email", new { token }, cancellationToken))
            .EnsureSuccessStatusCode();

        var response = await _client.PostAsJsonAsync("/api/auth/verify-email", new { token }, cancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var doc = await ReadJsonAsync(response, cancellationToken);
        Assert.True(doc.RootElement.GetProperty("alreadyVerified").GetBoolean());
    }

    [Fact]
    public async Task Verify_email_with_an_expired_token_returns_the_generic_invalid_response()
    {
        var cancellationToken = TestContext.Current.CancellationToken;

        // A dedicated factory with a near-instant token lifespan, layered on top of the shared
        // fixture's Postgres/Ministack wiring, so this test doesn't need a real 24h wait.
        using var shortLifespanFactory = _fixture.Factory.WithWebHostBuilder(builder =>
            builder.ConfigureServices(services =>
                services.Configure<DataProtectionTokenProviderOptions>(
                    o => o.TokenLifespan = TimeSpan.FromMilliseconds(1))));
        using var shortLifespanClient = shortLifespanFactory.CreateClient();

        var registerResponse = await shortLifespanClient.PostAsJsonAsync(
            "/api/auth/register",
            new
            {
                email = $"verify-{Guid.NewGuid():N}@example.com",
                password = "secret12",
                firstName = "Test",
                lastName = "User",
            },
            cancellationToken);
        registerResponse.EnsureSuccessStatusCode();
        var registerDoc = await ReadJsonAsync(registerResponse, cancellationToken);
        var userId = registerDoc.RootElement.GetProperty("user").GetProperty("id").GetGuid();

        await using (var scope = shortLifespanFactory.Services.CreateAsyncScope())
        {
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var user = await userManager.FindByIdAsync(userId.ToString());
            var rawToken = await userManager.GenerateEmailConfirmationTokenAsync(user!);
            var token = VerificationEmailContent.Encode(userId, rawToken);

            await Task.Delay(TimeSpan.FromMilliseconds(50), cancellationToken);

            var response = await shortLifespanClient.PostAsJsonAsync(
                "/api/auth/verify-email",
                new { token },
                cancellationToken);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        Assert.False(await IsEmailConfirmedAsync(userId, cancellationToken));
    }

    [Fact]
    public async Task Verify_email_with_an_unrecognized_token_returns_the_same_generic_response_as_expired()
    {
        var cancellationToken = TestContext.Current.CancellationToken;
        var madeUpToken = VerificationEmailContent.Encode(Guid.NewGuid(), "not-a-real-token");

        var response = await _client.PostAsJsonAsync(
            "/api/auth/verify-email",
            new { token = madeUpToken },
            cancellationToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var doc = await ReadJsonAsync(response, cancellationToken);
        Assert.Equal("This verification link is invalid or has expired.", doc.RootElement.GetProperty("detail").GetString());
    }

    [Fact]
    public async Task Resend_verification_invalidates_the_old_token_and_the_new_one_verifies()
    {
        var cancellationToken = TestContext.Current.CancellationToken;
        var (userId, jwt) = await RegisterAsync($"verify-{Guid.NewGuid():N}@example.com", cancellationToken);
        var oldToken = await GenerateEncodedTokenAsync(userId, cancellationToken);

        var resendResponse = await SendAuthenticatedAsync(HttpMethod.Post, "/api/auth/resend-verification", jwt, cancellationToken);
        Assert.Equal(HttpStatusCode.OK, resendResponse.StatusCode);

        var oldTokenAttempt = await _client.PostAsJsonAsync("/api/auth/verify-email", new { token = oldToken }, cancellationToken);
        Assert.Equal(HttpStatusCode.BadRequest, oldTokenAttempt.StatusCode);
        Assert.False(await IsEmailConfirmedAsync(userId, cancellationToken));

        var newToken = await GenerateEncodedTokenAsync(userId, cancellationToken);
        var newTokenAttempt = await _client.PostAsJsonAsync("/api/auth/verify-email", new { token = newToken }, cancellationToken);
        Assert.Equal(HttpStatusCode.OK, newTokenAttempt.StatusCode);
        Assert.True(await IsEmailConfirmedAsync(userId, cancellationToken));
    }

    [Fact]
    public async Task Resend_verification_when_already_verified_returns_conflict()
    {
        var cancellationToken = TestContext.Current.CancellationToken;
        var (userId, jwt) = await RegisterAsync($"verify-{Guid.NewGuid():N}@example.com", cancellationToken);
        var token = await GenerateEncodedTokenAsync(userId, cancellationToken);
        (await _client.PostAsJsonAsync("/api/auth/verify-email", new { token }, cancellationToken))
            .EnsureSuccessStatusCode();

        var response = await SendAuthenticatedAsync(HttpMethod.Post, "/api/auth/resend-verification", jwt, cancellationToken);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Resend_verification_within_cooldown_returns_too_many_requests()
    {
        var cancellationToken = TestContext.Current.CancellationToken;
        var (_, jwt) = await RegisterAsync($"verify-{Guid.NewGuid():N}@example.com", cancellationToken);

        var first = await SendAuthenticatedAsync(HttpMethod.Post, "/api/auth/resend-verification", jwt, cancellationToken);
        Assert.Equal(HttpStatusCode.OK, first.StatusCode);

        var second = await SendAuthenticatedAsync(HttpMethod.Post, "/api/auth/resend-verification", jwt, cancellationToken);
        Assert.Equal(HttpStatusCode.TooManyRequests, second.StatusCode);
    }

    [Fact]
    public async Task Resend_verification_without_authentication_returns_unauthorized()
    {
        var response = await _client.PostAsync("/api/auth/resend-verification", null, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    private async Task<(Guid UserId, string Token)> RegisterAsync(string email, CancellationToken cancellationToken)
    {
        var body = new
        {
            email,
            password = "secret12",
            firstName = "Test",
            lastName = "User",
        };

        var response = await _client.PostAsJsonAsync("/api/auth/register", body, cancellationToken);
        response.EnsureSuccessStatusCode();

        var doc = await ReadJsonAsync(response, cancellationToken);
        var userId = doc.RootElement.GetProperty("user").GetProperty("id").GetGuid();
        var token = doc.RootElement.GetProperty("token").GetString()!;
        return (userId, token);
    }

    private async Task<HttpResponseMessage> SendAuthenticatedAsync(
        HttpMethod method,
        string path,
        string jwt,
        CancellationToken cancellationToken)
    {
        var request = new HttpRequestMessage(method, path);
        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwt);
        return await _client.SendAsync(request, cancellationToken);
    }

    private async Task<bool> IsEmailConfirmedAsync(Guid userId, CancellationToken cancellationToken)
    {
        await using var scope = _fixture.Factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<GlobalScoutDbContext>();
        var user = await db.Users.AsNoTracking().SingleAsync(u => u.Id == userId, cancellationToken);
        return user.EmailConfirmed;
    }

    private async Task<string> GenerateEncodedTokenAsync(Guid userId, CancellationToken cancellationToken)
    {
        await using var scope = _fixture.Factory.Services.CreateAsyncScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var user = await userManager.FindByIdAsync(userId.ToString());
        var rawToken = await userManager.GenerateEmailConfirmationTokenAsync(user!);
        return VerificationEmailContent.Encode(userId, rawToken);
    }

    private static async Task<JsonDocument> ReadJsonAsync(HttpResponseMessage response, CancellationToken cancellationToken)
    {
        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        return await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
    }
}
