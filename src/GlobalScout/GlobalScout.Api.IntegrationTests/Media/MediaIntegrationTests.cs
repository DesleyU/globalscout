using System.Net;
using System.Text.Json;
using GlobalScout.Api.IntegrationTests.Social;
using Xunit;

namespace GlobalScout.Api.IntegrationTests.Media;

[Collection(nameof(IntegrationCollection))]
public sealed class MediaIntegrationTests
{
    private readonly IntegrationTestFixture _fixture;

    public MediaIntegrationTests(IntegrationTestFixture fixture) => _fixture = fixture;

    private CancellationToken Ct => TestContext.Current.CancellationToken;

    private static readonly byte[] MinimalVideoBytes = [0x00, 0x00, 0x01];

    [Fact]
    public async Task PostVideo_Unauthorized_Returns401()
    {
        var client = _fixture.Factory.CreateClient();
        using var response = await SocialIntegrationTestHelpers.UploadVideoAsync(
            client,
            MinimalVideoBytes,
            "clip.mp4",
            "video/mp4",
            Ct);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetVideosSelf_Unauthorized_Returns401()
    {
        var client = _fixture.Factory.CreateClient();
        using var response = await client.GetAsync("/api/media/videos", Ct);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetVideosForUser_Unauthorized_Returns401()
    {
        var client = _fixture.Factory.CreateClient();
        using var response = await client.GetAsync($"/api/media/videos/{Guid.NewGuid()}", Ct);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task DeleteVideo_Unauthorized_Returns401()
    {
        var client = _fixture.Factory.CreateClient();
        using var response = await client.DeleteAsync($"/api/media/video/{Guid.NewGuid()}", Ct);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task PostVideo_ClubUser_Returns403()
    {
        var factory = _fixture.Factory;
        var anon = factory.CreateClient();
        var (_, token) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(anon, Ct);
        var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, token);

        using var response = await SocialIntegrationTestHelpers.UploadVideoAsync(
            client,
            MinimalVideoBytes,
            "clip.mp4",
            "video/mp4",
            Ct);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task PostVideo_Player_MissingVideoPart_Returns400()
    {
        var factory = _fixture.Factory;
        var anon = factory.CreateClient();
        var (_, token) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(anon, Ct);
        var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, token);

        using var content = new MultipartFormDataContent();
        content.Add(new StringContent("only title"), "title");
        using var response = await client.PostAsync("/api/media/video", content, Ct);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task PostVideo_Player_Success_Returns200_WithPayload()
    {
        var factory = _fixture.Factory;
        var anon = factory.CreateClient();
        var (_, token) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(anon, Ct);
        var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, token);

        using var response = await SocialIntegrationTestHelpers.UploadVideoAsync(
            client,
            MinimalVideoBytes,
            "clip.mp4",
            "video/mp4",
            Ct);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        await using var stream = await response.Content.ReadAsStreamAsync(Ct);
        var doc = await JsonDocument.ParseAsync(stream, default, Ct);
        var root = doc.RootElement;
        Assert.Equal(JsonValueKind.String, root.GetProperty("url").ValueKind);
        Assert.True(root.GetProperty("id").TryGetGuid(out _));
        Assert.Equal("Integration title", root.GetProperty("title").GetString());
    }

    [Fact]
    public async Task PostVideo_Player_SecondUpload_OnBasic_Returns403()
    {
        var factory = _fixture.Factory;
        var anon = factory.CreateClient();
        var (_, token) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(anon, Ct);
        var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, token);

        using var first = await SocialIntegrationTestHelpers.UploadVideoAsync(
            client,
            MinimalVideoBytes,
            "one.mp4",
            "video/mp4",
            Ct);
        Assert.Equal(HttpStatusCode.OK, first.StatusCode);

        using var second = await SocialIntegrationTestHelpers.UploadVideoAsync(
            client,
            MinimalVideoBytes,
            "two.mp4",
            "video/mp4",
            Ct);

        Assert.Equal(HttpStatusCode.Forbidden, second.StatusCode);
        await using var s = await second.Content.ReadAsStreamAsync(Ct);
        var doc = await JsonDocument.ParseAsync(s, default, Ct);
        Assert.Equal("Video upload limit reached", doc.RootElement.GetProperty("error").GetString());
    }

    [Fact]
    public async Task GetVideos_Self_AfterUpload_ReturnsOne()
    {
        var factory = _fixture.Factory;
        var anon = factory.CreateClient();
        var (userId, token) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(anon, Ct);
        var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, token);

        using (var upload = await SocialIntegrationTestHelpers.UploadVideoAsync(
                   client,
                   MinimalVideoBytes,
                   "clip.mp4",
                   "video/mp4",
                   Ct))
        {
            _ = upload.StatusCode;
        }

        using var response = await client.GetAsync("/api/media/videos", Ct);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        await using var stream = await response.Content.ReadAsStreamAsync(Ct);
        var doc = await JsonDocument.ParseAsync(stream, default, Ct);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
        Assert.Equal(1, doc.RootElement.GetArrayLength());
        Assert.Equal(userId, doc.RootElement[0].GetProperty("userId").GetGuid());
        Assert.Equal("VIDEO", doc.RootElement[0].GetProperty("type").GetString());
    }

    [Fact]
    public async Task GetVideos_OtherUser_ReturnsTheirVideos()
    {
        var factory = _fixture.Factory;
        var anon = factory.CreateClient();
        var (ownerId, ownerToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(anon, Ct);
        var (_, viewerToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(anon, Ct);
        var ownerClient = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, ownerToken);

        using (await SocialIntegrationTestHelpers.UploadVideoAsync(
                   ownerClient,
                   MinimalVideoBytes,
                   "clip.mp4",
                   "video/mp4",
                   Ct))
        {
        }

        var viewer = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, viewerToken);
        using var response = await viewer.GetAsync($"/api/media/videos/{ownerId}", Ct);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        await using var stream = await response.Content.ReadAsStreamAsync(Ct);
        var doc = await JsonDocument.ParseAsync(stream, default, Ct);
        Assert.Equal(1, doc.RootElement.GetArrayLength());
        Assert.Equal(ownerId, doc.RootElement[0].GetProperty("userId").GetGuid());
    }

    [Fact]
    public async Task DeleteVideo_Success_Returns200()
    {
        var factory = _fixture.Factory;
        var anon = factory.CreateClient();
        var (_, token) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(anon, Ct);
        var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, token);

        Guid videoId;
        using (var upload = await SocialIntegrationTestHelpers.UploadVideoAsync(
                   client,
                   MinimalVideoBytes,
                   "clip.mp4",
                   "video/mp4",
                   Ct))
        {
            await using var stream = await upload.Content.ReadAsStreamAsync(Ct);
            var doc = await JsonDocument.ParseAsync(stream, default, Ct);
            videoId = doc.RootElement.GetProperty("id").GetGuid();
        }

        using var response = await client.DeleteAsync($"/api/media/video/{videoId}", Ct);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        await using var delStream = await response.Content.ReadAsStreamAsync(Ct);
        var delDoc = await JsonDocument.ParseAsync(delStream, default, Ct);
        Assert.Equal("Video deleted successfully", delDoc.RootElement.GetProperty("message").GetString());
    }

    [Fact]
    public async Task DeleteVideo_WrongId_Returns404()
    {
        var factory = _fixture.Factory;
        var anon = factory.CreateClient();
        var (_, token) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(anon, Ct);
        var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, token);

        using var response = await client.DeleteAsync($"/api/media/video/{Guid.NewGuid()}", Ct);
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task DeleteVideo_AnotherUsersVideo_Returns404()
    {
        var factory = _fixture.Factory;
        var anon = factory.CreateClient();
        var (_, ownerToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(anon, Ct);
        var (_, attackerToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(anon, Ct);
        var owner = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, ownerToken);

        Guid videoId;
        using (var upload = await SocialIntegrationTestHelpers.UploadVideoAsync(
                   owner,
                   MinimalVideoBytes,
                   "clip.mp4",
                   "video/mp4",
                   Ct))
        {
            await using var stream = await upload.Content.ReadAsStreamAsync(Ct);
            var doc = await JsonDocument.ParseAsync(stream, default, Ct);
            videoId = doc.RootElement.GetProperty("id").GetGuid();
        }

        var attacker = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, attackerToken);
        using var response = await attacker.DeleteAsync($"/api/media/video/{videoId}", Ct);
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
