using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using GlobalScout.Application.Abstractions.Auth;
using GlobalScout.Infrastructure.Data;
using GlobalScout.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace GlobalScout.Api.IntegrationTests.Auth.ExternalLogin;

internal static class ExternalLoginIntegrationTestHelpers
{
    public const string DefaultProvider = "google";
    public const string DefaultProviderScheme = "Google";

    public static ExternalLoginInfoDto GoogleInfo(
        string? email = null,
        bool emailVerified = true,
        string firstName = "Pedri",
        string lastName = "Gonzalez",
        int? age = null,
        DateOnly? dateOfBirth = null,
        string? providerKey = null) =>
        new(
            DefaultProviderScheme,
            providerKey ?? $"google-{Guid.NewGuid():N}",
            email ?? $"external-{Guid.NewGuid():N}@example.com",
            emailVerified,
            firstName,
            lastName,
            age,
            dateOfBirth);

    /// <summary>Derives a factory with the fake external-login accessor swapped in for this scenario.</summary>
    public static WebApplicationFactory<Program> WithFakeExternalLogin(
        this IntegrationTestFixture fixture,
        ExternalLoginInfoDto info) =>
        fixture.Factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureTestServices(services =>
            {
                services.RemoveAll<IExternalLoginAccessor>();
                services.AddScoped<IExternalLoginAccessor>(_ => new FakeExternalLoginAccessor(info));
            });
        });

    public static Task<HttpResponseMessage> CallbackAsync(
        WebApplicationFactory<Program> factory,
        CancellationToken cancellationToken,
        string provider = DefaultProvider) =>
        factory.CreateClient().GetAsync($"/api/auth/external/{provider}/callback", cancellationToken);

    public static Task<HttpResponseMessage> CallbackWithRemoteErrorAsync(
        WebApplicationFactory<Program> factory,
        CancellationToken cancellationToken,
        string provider = DefaultProvider) =>
        factory.CreateClient().GetAsync($"/api/auth/external/{provider}/callback?remoteError=1", cancellationToken);

    /// <summary>Pulls the hidden `code`/`error` field value out of the callback's form_post HTML page.</summary>
    public static async Task<string?> ExtractFormFieldAsync(
        HttpResponseMessage response,
        string fieldName,
        CancellationToken cancellationToken)
    {
        var html = await response.Content.ReadAsStringAsync(cancellationToken);
        var match = Regex.Match(html, $"name=\"{Regex.Escape(fieldName)}\" value=\"([^\"]*)\"");
        return match.Success ? match.Groups[1].Value : null;
    }

    public static async Task<JsonElement> ExchangeAsync(
        WebApplicationFactory<Program> factory,
        string code,
        CancellationToken cancellationToken)
    {
        using var client = factory.CreateClient();
        using var response = await client.PostAsJsonAsync("/api/auth/external/exchange", new { code }, cancellationToken);
        response.EnsureSuccessStatusCode();
        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        var doc = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
        return doc.RootElement.Clone();
    }

    public static async Task<int> CountUsersWithEmailAsync(
        WebApplicationFactory<Program> factory,
        string email,
        CancellationToken cancellationToken)
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<GlobalScoutDbContext>();
        return await db.Users.CountAsync(u => u.NormalizedEmail == email.Trim().ToUpperInvariant(), cancellationToken);
    }

    public static async Task<bool> IsEmailConfirmedAsync(
        WebApplicationFactory<Program> factory,
        string email,
        CancellationToken cancellationToken)
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<GlobalScoutDbContext>();
        var user = await db.Users.AsNoTracking()
            .SingleAsync(u => u.NormalizedEmail == email.Trim().ToUpperInvariant(), cancellationToken);
        return user.EmailConfirmed;
    }

    public static async Task<int> CountLoginsAsync(
        WebApplicationFactory<Program> factory,
        Guid userId,
        CancellationToken cancellationToken)
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null)
        {
            return 0;
        }

        var logins = await userManager.GetLoginsAsync(user);
        return logins.Count;
    }
}
