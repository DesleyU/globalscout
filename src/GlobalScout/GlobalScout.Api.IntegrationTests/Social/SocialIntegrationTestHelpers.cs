using System.Net.Http.Json;
using System.Text.Json;

namespace GlobalScout.Api.IntegrationTests.Social;

/// <summary>Registers club users (minimal validation surface) and calls Social HTTP APIs.</summary>
internal static class SocialIntegrationTestHelpers
{
    public static async Task<(Guid UserId, string Token)> RegisterClubUserAsync(
        HttpClient client,
        CancellationToken cancellationToken)
    {
        var email = $"club-{Guid.NewGuid():N}@example.com";
        using var response = await client.PostAsJsonAsync(
            "/api/auth/register",
            new
            {
                email,
                password = "secret12",
                role = "CLUB",
                firstName = "Test",
                lastName = "Club",
                position = (string?)null,
                age = (int?)null,
                clubName = "Integration FC"
            },
            cancellationToken);

        response.EnsureSuccessStatusCode();
        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        var doc = await JsonDocument.ParseAsync(stream, default, cancellationToken);
        var root = doc.RootElement;
        var token = root.GetProperty("token").GetString()!;
        var userId = root.GetProperty("user").GetProperty("id").GetGuid();
        return (userId, token);
    }

    public static HttpClient CreateAuthenticatedClient(WebApplicationFactory<Program> factory, string token)
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    public static async Task<Guid> SendConnectionRequestAsync(
        HttpClient client,
        Guid receiverId,
        CancellationToken cancellationToken)
    {
        using var response = await client.PostAsJsonAsync(
            "/api/connections/send",
            new { receiverId },
            cancellationToken);
        response.EnsureSuccessStatusCode();
        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        var doc = await JsonDocument.ParseAsync(stream, default, cancellationToken);
        return doc.RootElement.GetProperty("connection").GetProperty("id").GetGuid();
    }

    public static Task<HttpResponseMessage> SendConnectionRequestRawAsync(
        HttpClient client,
        Guid receiverId,
        CancellationToken cancellationToken) =>
        client.PostAsJsonAsync("/api/connections/send", new { receiverId }, cancellationToken);

    public static Task<HttpResponseMessage> RespondToConnectionAsync(
        HttpClient client,
        Guid connectionId,
        string action,
        CancellationToken cancellationToken) =>
        client.PutAsJsonAsync($"/api/connections/{connectionId}/respond", new { action }, cancellationToken);

    public static Task<HttpResponseMessage> FollowUserAsync(
        HttpClient client,
        Guid targetUserId,
        CancellationToken cancellationToken) =>
        client.SendAsync(
            new HttpRequestMessage(HttpMethod.Post, $"/api/follow/{targetUserId}/follow"),
            cancellationToken);

    public static Task<HttpResponseMessage> UnfollowUserAsync(
        HttpClient client,
        Guid targetUserId,
        CancellationToken cancellationToken) =>
        client.DeleteAsync($"/api/follow/{targetUserId}/unfollow", cancellationToken);
}
