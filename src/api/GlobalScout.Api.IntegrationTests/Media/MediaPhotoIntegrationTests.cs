using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using GlobalScout.Api.IntegrationTests.Social;
using Xunit;

namespace GlobalScout.Api.IntegrationTests.Media;

[Collection(nameof(IntegrationCollection))]
public sealed class MediaPhotoIntegrationTests
{
    private readonly IntegrationTestFixture _fixture;

    public MediaPhotoIntegrationTests(IntegrationTestFixture fixture) => _fixture = fixture;

    private CancellationToken Ct => TestContext.Current.CancellationToken;

    private static readonly byte[] MinimalPhotoBytes = [0xFF, 0xD8, 0xFF];

    [Fact]
    public async Task PostPhoto_Unauthorized_Returns401()
    {
        var client = _fixture.Factory.CreateClient();
        using var response = await SocialIntegrationTestHelpers.UploadPhotoAsync(
            client,
            MinimalPhotoBytes,
            "photo.jpg",
            "image/jpeg",
            Ct);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetPhotosSelf_Unauthorized_Returns401()
    {
        var client = _fixture.Factory.CreateClient();
        using var response = await client.GetAsync("/api/media/photos", Ct);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetPhotosForUser_Unauthorized_Returns401()
    {
        var client = _fixture.Factory.CreateClient();
        using var response = await client.GetAsync($"/api/media/photos/{Guid.NewGuid()}", Ct);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task DeletePhoto_Unauthorized_Returns401()
    {
        var client = _fixture.Factory.CreateClient();
        using var response = await client.DeleteAsync($"/api/media/photo/{Guid.NewGuid()}", Ct);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task PostPhoto_ClubUser_Returns403()
    {
        var factory = _fixture.Factory;
        var (_, token) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(factory, Ct);
        var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, token);

        using var response = await SocialIntegrationTestHelpers.UploadPhotoAsync(
            client,
            MinimalPhotoBytes,
            "photo.jpg",
            "image/jpeg",
            Ct);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task PostPhoto_Player_MissingFileMetadata_Returns400()
    {
        var factory = _fixture.Factory;
        var (_, token) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);
        var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, token);

        using var response = await client.PostAsJsonAsync(
            "/api/media/photo/upload-url",
            new { fileName = "", contentType = "image/jpeg", contentLength = 0 },
            Ct);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task PostPhoto_Player_Success_Returns200_WithPayload()
    {
        var factory = _fixture.Factory;
        var (_, token) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);
        var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, token);

        using var response = await SocialIntegrationTestHelpers.UploadPhotoAsync(
            client,
            MinimalPhotoBytes,
            "photo.jpg",
            "image/jpeg",
            Ct);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        await using var stream = await response.Content.ReadAsStreamAsync(Ct);
        var doc = await JsonDocument.ParseAsync(stream, default, Ct);
        var root = doc.RootElement;
        Assert.Equal(JsonValueKind.String, root.GetProperty("storageKey").ValueKind);
        Assert.True(root.GetProperty("id").TryGetGuid(out _));
        Assert.Equal("Integration title", root.GetProperty("title").GetString());
    }

    [Fact]
    public async Task GetMediaUrl_Owner_AfterPhotoUpload_ReturnsSignedUrl()
    {
        var factory = _fixture.Factory;
        var (_, token) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);
        var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, token);

        Guid photoId;
        using (var upload = await SocialIntegrationTestHelpers.UploadPhotoAsync(
                   client,
                   MinimalPhotoBytes,
                   "photo.jpg",
                   "image/jpeg",
                   Ct))
        {
            await using var stream = await upload.Content.ReadAsStreamAsync(Ct);
            var doc = await JsonDocument.ParseAsync(stream, default, Ct);
            photoId = doc.RootElement.GetProperty("id").GetGuid();
        }

        using var response = await client.GetAsync($"/api/media/{photoId}/url", Ct);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        await using var readStream = await response.Content.ReadAsStreamAsync(Ct);
        var readDoc = await JsonDocument.ParseAsync(readStream, default, Ct);
        Assert.StartsWith("http://", readDoc.RootElement.GetProperty("url").GetString());
    }

    [Fact]
    public async Task PostPhoto_Player_FourthUpload_OnBasic_Returns403()
    {
        var factory = _fixture.Factory;
        var (_, token) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);
        var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, token);

        for (var i = 0; i < 3; i++)
        {
            using var upload = await SocialIntegrationTestHelpers.UploadPhotoAsync(
                client,
                MinimalPhotoBytes,
                $"photo{i}.jpg",
                "image/jpeg",
                Ct);
            Assert.Equal(HttpStatusCode.OK, upload.StatusCode);
        }

        using var fourth = await SocialIntegrationTestHelpers.UploadPhotoAsync(
            client,
            MinimalPhotoBytes,
            "photo3.jpg",
            "image/jpeg",
            Ct);

        Assert.Equal(HttpStatusCode.Forbidden, fourth.StatusCode);
        await using var s = await fourth.Content.ReadAsStreamAsync(Ct);
        var doc = await JsonDocument.ParseAsync(s, default, Ct);
        Assert.Equal("Photo upload limit reached", doc.RootElement.GetProperty("error").GetString());
    }

    [Fact]
    public async Task GetPhotos_Self_AfterUpload_ReturnsOne()
    {
        var factory = _fixture.Factory;
        var (userId, token) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);
        var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, token);

        using (await SocialIntegrationTestHelpers.UploadPhotoAsync(
                   client,
                   MinimalPhotoBytes,
                   "photo.jpg",
                   "image/jpeg",
                   Ct))
        {
        }

        using var response = await client.GetAsync("/api/media/photos", Ct);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        await using var stream = await response.Content.ReadAsStreamAsync(Ct);
        var doc = await JsonDocument.ParseAsync(stream, default, Ct);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
        Assert.Equal(1, doc.RootElement.GetArrayLength());
        Assert.Equal(userId, doc.RootElement[0].GetProperty("userId").GetGuid());
        Assert.Equal("IMAGE", doc.RootElement[0].GetProperty("type").GetString());
    }

    [Fact]
    public async Task GetPhotos_OtherUser_ReturnsTheirPhotos()
    {
        var factory = _fixture.Factory;
        var (ownerId, ownerToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);
        var (_, viewerToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);
        var ownerClient = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, ownerToken);

        using (await SocialIntegrationTestHelpers.UploadPhotoAsync(
                   ownerClient,
                   MinimalPhotoBytes,
                   "photo.jpg",
                   "image/jpeg",
                   Ct))
        {
        }

        var viewer = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, viewerToken);
        using var response = await viewer.GetAsync($"/api/media/photos/{ownerId}", Ct);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        await using var stream = await response.Content.ReadAsStreamAsync(Ct);
        var doc = await JsonDocument.ParseAsync(stream, default, Ct);
        Assert.Equal(1, doc.RootElement.GetArrayLength());
        Assert.Equal(ownerId, doc.RootElement[0].GetProperty("userId").GetGuid());
    }

    [Fact]
    public async Task DeletePhoto_Success_Returns200()
    {
        var factory = _fixture.Factory;
        var (_, token) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);
        var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, token);

        Guid photoId;
        using (var upload = await SocialIntegrationTestHelpers.UploadPhotoAsync(
                   client,
                   MinimalPhotoBytes,
                   "photo.jpg",
                   "image/jpeg",
                   Ct))
        {
            await using var stream = await upload.Content.ReadAsStreamAsync(Ct);
            var doc = await JsonDocument.ParseAsync(stream, default, Ct);
            photoId = doc.RootElement.GetProperty("id").GetGuid();
        }

        using var response = await client.DeleteAsync($"/api/media/photo/{photoId}", Ct);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        await using var delStream = await response.Content.ReadAsStreamAsync(Ct);
        var delDoc = await JsonDocument.ParseAsync(delStream, default, Ct);
        Assert.Equal("Photo deleted successfully", delDoc.RootElement.GetProperty("message").GetString());
    }

    [Fact]
    public async Task DeletePhoto_WrongId_Returns404()
    {
        var factory = _fixture.Factory;
        var (_, token) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);
        var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, token);

        using var response = await client.DeleteAsync($"/api/media/photo/{Guid.NewGuid()}", Ct);
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task DeletePhoto_AnotherUsersPhoto_Returns404()
    {
        var factory = _fixture.Factory;
        var (_, ownerToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);
        var (_, attackerToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);
        var owner = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, ownerToken);

        Guid photoId;
        using (var upload = await SocialIntegrationTestHelpers.UploadPhotoAsync(
                   owner,
                   MinimalPhotoBytes,
                   "photo.jpg",
                   "image/jpeg",
                   Ct))
        {
            await using var stream = await upload.Content.ReadAsStreamAsync(Ct);
            var doc = await JsonDocument.ParseAsync(stream, default, Ct);
            photoId = doc.RootElement.GetProperty("id").GetGuid();
        }

        var attacker = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, attackerToken);
        using var response = await attacker.DeleteAsync($"/api/media/photo/{photoId}", Ct);
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
