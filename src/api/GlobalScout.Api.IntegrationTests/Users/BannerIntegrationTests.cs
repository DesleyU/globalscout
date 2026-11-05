using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using GlobalScout.Api.IntegrationTests.Social;
using Xunit;

namespace GlobalScout.Api.IntegrationTests.Users;

[Collection(nameof(IntegrationCollection))]
public sealed class BannerIntegrationTests
{
    private readonly IntegrationTestFixture _fixture;

    public BannerIntegrationTests(IntegrationTestFixture fixture) => _fixture = fixture;

    private CancellationToken Ct => TestContext.Current.CancellationToken;

    private static readonly byte[] MinimalBannerBytes = [0xFF, 0xD8, 0xFF];

    [Fact]
    public async Task PostBannerUploadUrl_Unauthorized_Returns401()
    {
        var client = _fixture.Factory.CreateClient();
        using var response = await client.PostAsJsonAsync(
            "/api/users/banner/upload-url",
            new { fileName = "banner.jpg", contentType = "image/jpeg", contentLength = MinimalBannerBytes.LongLength },
            Ct);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task PostBannerComplete_Unauthorized_Returns401()
    {
        var client = _fixture.Factory.CreateClient();
        using var response = await client.PostAsJsonAsync(
            "/api/users/banner/complete",
            new { storageKey = "banners/whatever/x.jpg" },
            Ct);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Banner_RoundTrip_PlayerAccount_Succeeds()
    {
        var factory = _fixture.Factory;
        var (userId, token) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);
        var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, token);

        var (storageKey, profile) = await UploadBannerAsync(client, Ct);

        Assert.NotNull(profile.GetProperty("banner").GetString());
        Assert.Equal(userId, profile.GetProperty("id").GetGuid());

        using var readResponse = await client.GetAsync($"/api/users/{userId}/banner/url", Ct);
        Assert.Equal(HttpStatusCode.OK, readResponse.StatusCode);
        await using var readStream = await readResponse.Content.ReadAsStreamAsync(Ct);
        var readDoc = await JsonDocument.ParseAsync(readStream, default, Ct);
        Assert.StartsWith("http://", readDoc.RootElement.GetProperty("url").GetString());
        Assert.NotEmpty(storageKey);
    }

    [Fact]
    public async Task Banner_RoundTrip_ClubAccount_Succeeds()
    {
        var factory = _fixture.Factory;
        var (_, token) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(factory, Ct);
        var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, token);

        var (storageKey, profile) = await UploadBannerAsync(client, Ct);

        Assert.NotEmpty(storageKey);
        Assert.NotNull(profile.GetProperty("banner").GetString());
    }

    [Fact]
    public async Task PostBannerComplete_AnotherUsersStorageKey_Returns403()
    {
        var factory = _fixture.Factory;
        var (_, ownerToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);
        var (_, attackerToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);
        var owner = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, ownerToken);
        var attacker = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, attackerToken);

        using var initiate = await owner.PostAsJsonAsync(
            "/api/users/banner/upload-url",
            new { fileName = "banner.jpg", contentType = "image/jpeg", contentLength = MinimalBannerBytes.LongLength },
            Ct);
        Assert.Equal(HttpStatusCode.OK, initiate.StatusCode);
        await using var initiateStream = await initiate.Content.ReadAsStreamAsync(Ct);
        var initiateDoc = await JsonDocument.ParseAsync(initiateStream, default, Ct);
        var storageKey = initiateDoc.RootElement.GetProperty("storageKey").GetString()!;

        using var response = await attacker.PostAsJsonAsync(
            "/api/users/banner/complete",
            new { storageKey },
            Ct);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    private static async Task<(string StorageKey, JsonElement Profile)> UploadBannerAsync(
        HttpClient client,
        CancellationToken cancellationToken)
    {
        using var initiate = await client.PostAsJsonAsync(
            "/api/users/banner/upload-url",
            new { fileName = "banner.jpg", contentType = "image/jpeg", contentLength = MinimalBannerBytes.LongLength },
            cancellationToken);
        Assert.Equal(HttpStatusCode.OK, initiate.StatusCode);

        await using var initiateStream = await initiate.Content.ReadAsStreamAsync(cancellationToken);
        var initiateDoc = await JsonDocument.ParseAsync(initiateStream, default, cancellationToken);
        var storageKey = initiateDoc.RootElement.GetProperty("storageKey").GetString()!;
        var uploadUrl = initiateDoc.RootElement.GetProperty("uploadUrl").GetString()!;

        using (var s3 = new HttpClient())
        using (var uploadContent = new ByteArrayContent(MinimalBannerBytes))
        {
            uploadContent.Headers.ContentType = new("image/jpeg");
            using var upload = await s3.PutAsync(uploadUrl, uploadContent, cancellationToken);
            upload.EnsureSuccessStatusCode();
        }

        using var complete = await client.PostAsJsonAsync(
            "/api/users/banner/complete",
            new { storageKey },
            cancellationToken);
        Assert.Equal(HttpStatusCode.OK, complete.StatusCode);

        await using var completeStream = await complete.Content.ReadAsStreamAsync(cancellationToken);
        var completeDoc = await JsonDocument.ParseAsync(completeStream, default, cancellationToken);
        return (storageKey, completeDoc.RootElement.GetProperty("profile").Clone());
    }
}
