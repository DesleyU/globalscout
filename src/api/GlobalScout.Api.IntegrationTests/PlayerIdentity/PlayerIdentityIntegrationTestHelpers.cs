using System.Net.Http.Json;
using System.Text.Json;
using GlobalScout.Api.IntegrationTests.Social;
using GlobalScout.Application.Abstractions.PlayerIdentity;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace GlobalScout.Api.IntegrationTests.PlayerIdentity;

internal sealed record PlayerIdentityTestContext(
    WebApplicationFactory<Program> Factory,
    int FakeExternalPlayerId);

internal static class PlayerIdentityIntegrationTestHelpers
{
    public static readonly DateOnly DefaultDateOfBirth = new(2003, 4, 12);

    public static PlayerIdentityTestContext CreateContext(IntegrationTestFixture fixture)
    {
        var fakeExternalPlayerId = Random.Shared.Next(100_000, 999_999);
        var factory = fixture.Factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureTestServices(services =>
            {
                services.RemoveAll<IExternalPlayerSearch>();
                services.AddSingleton<IExternalPlayerSearch>(
                    new FakeExternalPlayerSearch(fakeExternalPlayerId));
            });
        });

        return new PlayerIdentityTestContext(factory, fakeExternalPlayerId);
    }

    public static object DefaultSearchBody() => new
    {
        firstName = "Pedri",
        lastName = "Gonzalez",
        dateOfBirth = DefaultDateOfBirth,
        nationality = "Spain",
        currentCountry = "Spain",
        currentTeamId = 529,
        currentTeamName = "FC Barcelona",
        position = "MIDFIELDER",
        previousClub = "Las Palmas",
        league = "La Liga"
    };

    public static object DefaultClaimBody(int externalPlayerId) => new
    {
        externalPlayerId,
        provider = ExternalPlayerProviders.ApiFootball,
        firstName = "Pedri",
        lastName = "Gonzalez",
        dateOfBirth = DefaultDateOfBirth,
        nationality = "Spain",
        currentCountry = "Spain",
        currentTeamId = 529,
        currentClub = "FC Barcelona",
        position = "MIDFIELDER",
        previousClub = "Las Palmas",
        league = "La Liga"
    };

    public static Task<HttpResponseMessage> SearchAsync(HttpClient client, CancellationToken cancellationToken) =>
        client.PostAsJsonAsync("/api/player-identity/search", DefaultSearchBody(), cancellationToken);

    public static Task<HttpResponseMessage> CreateClaimAsync(
        HttpClient client,
        int externalPlayerId,
        CancellationToken cancellationToken) =>
        client.PostAsJsonAsync("/api/player-identity/claims", DefaultClaimBody(externalPlayerId), cancellationToken);

    public static Task<HttpResponseMessage> GetMyClaimAsync(HttpClient client, CancellationToken cancellationToken) =>
        client.GetAsync("/api/player-identity/claims/me", cancellationToken);

    public static Task<HttpResponseMessage> AddLinkEvidenceAsync(
        HttpClient client,
        string type,
        string url,
        CancellationToken cancellationToken) =>
        client.PostAsJsonAsync(
            "/api/player-identity/claims/me/evidence/link",
            new { type, url, note = "Official profile" },
            cancellationToken);

    public static async Task<Guid> CreateClaimAndGetIdAsync(
        HttpClient playerClient,
        int externalPlayerId,
        CancellationToken cancellationToken)
    {
        using var response = await CreateClaimAsync(playerClient, externalPlayerId, cancellationToken);
        response.EnsureSuccessStatusCode();
        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        var doc = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
        return doc.RootElement.GetProperty("id").GetGuid();
    }

    public static async Task SubmitClaimForReviewAsync(
        HttpClient playerClient,
        int externalPlayerId,
        CancellationToken cancellationToken)
    {
        using var create = await CreateClaimAsync(playerClient, externalPlayerId, cancellationToken);
        create.EnsureSuccessStatusCode();

        using var evidence = await AddLinkEvidenceAsync(
            playerClient,
            "ProfileUrl",
            "https://www.fcbarcelona.com/en/football/first-team/players/pedri",
            cancellationToken);
        evidence.EnsureSuccessStatusCode();
    }
}
