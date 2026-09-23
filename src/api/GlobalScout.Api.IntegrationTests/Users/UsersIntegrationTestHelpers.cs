using System.Net.Http.Json;
using System.Text.Json;

namespace GlobalScout.Api.IntegrationTests.Users;

/// <summary>Profile-editing and search helpers shared across Users-area integration tests.</summary>
internal static class UsersIntegrationTestHelpers
{
    public static Task<HttpResponseMessage> UpdateProfileAsync(
        HttpClient client,
        object body,
        CancellationToken cancellationToken) =>
        client.PutAsJsonAsync("/api/users/profile", body, cancellationToken);

    public static async Task<List<Guid>> SearchResultIdsAsync(
        HttpClient client,
        string queryString,
        CancellationToken cancellationToken)
    {
        using var response = await client.GetAsync($"/api/users/search{queryString}", cancellationToken);
        response.EnsureSuccessStatusCode();
        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        var doc = await JsonDocument.ParseAsync(stream, default, cancellationToken);
        return doc.RootElement.GetProperty("users").EnumerateArray()
            .Select(u => u.GetProperty("id").GetGuid())
            .ToList();
    }
}
