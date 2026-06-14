using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using GlobalScout.Domain.Identity;
using GlobalScout.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;

namespace GlobalScout.Api.IntegrationTests.Social;

/// <summary>Registers users and calls Social HTTP APIs.</summary>
internal static class SocialIntegrationTestHelpers
{
    public static async Task<(Guid UserId, string Token)> RegisterPlayerUserAsync(
        WebApplicationFactory<Program> factory,
        CancellationToken cancellationToken)
    {
        var (userId, email, _) = await RegisterUserCoreAsync(factory, cancellationToken);
        await AssignRoleAsync(factory, userId, AppRoleNames.Player, cancellationToken);
        var token = await LoginAsync(factory, email, cancellationToken);
        return (userId, token);
    }

    public static async Task<(Guid UserId, string Token)> RegisterClubUserAsync(
        WebApplicationFactory<Program> factory,
        CancellationToken cancellationToken)
    {
        var (userId, email, _) = await RegisterUserCoreAsync(factory, cancellationToken);
        await AssignRoleAsync(factory, userId, AppRoleNames.Club, cancellationToken);
        var token = await LoginAsync(factory, email, cancellationToken);
        return (userId, token);
    }

    public static async Task<(Guid UserId, string Token)> RegisterUserAsync(
        WebApplicationFactory<Program> factory,
        CancellationToken cancellationToken)
    {
        var (userId, _, token) = await RegisterUserCoreAsync(factory, cancellationToken);
        return (userId, token);
    }

    private static async Task<(Guid UserId, string Email, string Token)> RegisterUserCoreAsync(
        WebApplicationFactory<Program> factory,
        CancellationToken cancellationToken)
    {
        var client = factory.CreateClient();
        var email = $"user-{Guid.NewGuid():N}@example.com";
        using var response = await client.PostAsJsonAsync(
            "/api/auth/register",
            new
            {
                email,
                password = "secret12",
                firstName = "Test",
                lastName = "User",
            },
            cancellationToken);

        response.EnsureSuccessStatusCode();
        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        var doc = await JsonDocument.ParseAsync(stream, default, cancellationToken);
        var root = doc.RootElement;
        var token = root.GetProperty("token").GetString()!;
        var userId = root.GetProperty("user").GetProperty("id").GetGuid();
        return (userId, email, token);
    }

    private static async Task AssignRoleAsync(
        WebApplicationFactory<Program> factory,
        Guid userId,
        string roleName,
        CancellationToken cancellationToken)
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null)
        {
            throw new InvalidOperationException($"User {userId} not found.");
        }

        var roles = await userManager.GetRolesAsync(user);
        if (roles.Count > 0)
        {
            var remove = await userManager.RemoveFromRolesAsync(user, roles);
            if (!remove.Succeeded)
            {
                throw new InvalidOperationException(
                    $"Failed to remove roles: {string.Join(", ", remove.Errors.Select(e => e.Description))}");
            }
        }

        var add = await userManager.AddToRoleAsync(user, roleName);
        if (!add.Succeeded)
        {
            throw new InvalidOperationException(
                $"Failed to assign role {roleName}: {string.Join(", ", add.Errors.Select(e => e.Description))}");
        }

        cancellationToken.ThrowIfCancellationRequested();
    }

    private static async Task<string> LoginAsync(
        WebApplicationFactory<Program> factory,
        string email,
        CancellationToken cancellationToken)
    {
        var client = factory.CreateClient();
        using var response = await client.PostAsJsonAsync(
            "/api/auth/login",
            new { email, password = "secret12" },
            cancellationToken);

        response.EnsureSuccessStatusCode();
        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        var doc = await JsonDocument.ParseAsync(stream, default, cancellationToken);
        return doc.RootElement.GetProperty("token").GetString()!;
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

    public static async Task<HttpResponseMessage> UploadVideoAsync(
        HttpClient client,
        byte[] fileBytes,
        string fileName,
        string contentType,
        CancellationToken cancellationToken)
    {
        using var initiate = await client.PostAsJsonAsync(
            "/api/media/video/upload-url",
            new
            {
                fileName,
                contentType,
                contentLength = fileBytes.LongLength
            },
            cancellationToken);

        if (!initiate.IsSuccessStatusCode)
        {
            return await CloneResponseAsync(initiate, cancellationToken);
        }

        await using var initiateStream = await initiate.Content.ReadAsStreamAsync(cancellationToken);
        var initiateDoc = await JsonDocument.ParseAsync(initiateStream, default, cancellationToken);
        var storageKey = initiateDoc.RootElement.GetProperty("storageKey").GetString()!;
        var uploadUrl = initiateDoc.RootElement.GetProperty("uploadUrl").GetString()!;

        using (var s3 = new HttpClient())
        using (var uploadContent = new ByteArrayContent(fileBytes))
        {
            uploadContent.Headers.ContentType = new(contentType);
            using var upload = await s3.PutAsync(uploadUrl, uploadContent, cancellationToken);
            upload.EnsureSuccessStatusCode();
        }

        return await client.PostAsJsonAsync(
            "/api/media/video/complete",
            new
            {
                storageKey,
                fileName,
                contentType,
                title = "Integration title",
                description = "Integration description",
                tags = ""
            },
            cancellationToken);
    }

    private static async Task<HttpResponseMessage> CloneResponseAsync(
        HttpResponseMessage response,
        CancellationToken cancellationToken)
    {
        var clone = new HttpResponseMessage(response.StatusCode)
        {
            Content = new ByteArrayContent(await response.Content.ReadAsByteArrayAsync(cancellationToken))
        };

        foreach (var header in response.Content.Headers)
        {
            clone.Content.Headers.TryAddWithoutValidation(header.Key, header.Value);
        }

        return clone;
    }
}
