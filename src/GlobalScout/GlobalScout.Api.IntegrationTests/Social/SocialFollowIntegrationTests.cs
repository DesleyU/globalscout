using System.Net.Http.Json;
using System.Text.Json;

namespace GlobalScout.Api.IntegrationTests.Social;

[Collection(nameof(IntegrationCollection))]
public sealed class SocialFollowIntegrationTests
{
    private readonly IntegrationTestFixture _fixture;

    public SocialFollowIntegrationTests(IntegrationTestFixture fixture) => _fixture = fixture;

    private CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task Follow_Unauthorized_Returns401()
    {
        var client = _fixture.Factory.CreateClient();
        using var response = await client.PostAsync(
            $"/api/follow/{Guid.NewGuid()}/follow",
            null,
            Ct);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetFollowers_Unauthorized_Returns401()
    {
        var client = _fixture.Factory.CreateClient();
        using var response = await client.GetAsync($"/api/follow/{Guid.NewGuid()}/followers", Ct);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Follow_Success_Returns200()
    {
        var factory = _fixture.Factory;
        var anon = factory.CreateClient();
        var (_, followerToken) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(anon, Ct);
        var (targetId, _) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(anon, Ct);

        var follower = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, followerToken);
        using var response = await SocialIntegrationTestHelpers.FollowUserAsync(follower, targetId, Ct);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        await using var stream = await response.Content.ReadAsStreamAsync(Ct);
        var doc = await JsonDocument.ParseAsync(stream, default, Ct);
        Assert.Equal("Successfully followed user", doc.RootElement.GetProperty("message").GetString());
        Assert.Equal(targetId, doc.RootElement.GetProperty("follow").GetProperty("followingUser").GetProperty("id").GetGuid());
    }

    [Fact]
    public async Task Follow_Self_Returns400()
    {
        var factory = _fixture.Factory;
        var anon = factory.CreateClient();
        var (userId, token) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(anon, Ct);
        var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, token);

        using var response = await SocialIntegrationTestHelpers.FollowUserAsync(client, userId, Ct);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Follow_UserNotFound_Returns404()
    {
        var factory = _fixture.Factory;
        var anon = factory.CreateClient();
        var (_, token) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(anon, Ct);
        var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, token);

        using var response = await SocialIntegrationTestHelpers.FollowUserAsync(client, Guid.NewGuid(), Ct);
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Follow_AlreadyFollowing_Returns400()
    {
        var factory = _fixture.Factory;
        var anon = factory.CreateClient();
        var (_, followerToken) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(anon, Ct);
        var (targetId, _) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(anon, Ct);

        var follower = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, followerToken);
        using var first = await SocialIntegrationTestHelpers.FollowUserAsync(follower, targetId, Ct);
        Assert.Equal(HttpStatusCode.OK, first.StatusCode);

        using var second = await SocialIntegrationTestHelpers.FollowUserAsync(follower, targetId, Ct);
        Assert.Equal(HttpStatusCode.BadRequest, second.StatusCode);
    }

    [Fact]
    public async Task Unfollow_Success_Returns200()
    {
        var factory = _fixture.Factory;
        var anon = factory.CreateClient();
        var (_, followerToken) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(anon, Ct);
        var (targetId, _) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(anon, Ct);

        var follower = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, followerToken);
        await SocialIntegrationTestHelpers.FollowUserAsync(follower, targetId, Ct);

        using var response = await SocialIntegrationTestHelpers.UnfollowUserAsync(follower, targetId, Ct);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        await using var stream = await response.Content.ReadAsStreamAsync(Ct);
        var doc = await JsonDocument.ParseAsync(stream, default, Ct);
        Assert.Equal("Successfully unfollowed user", doc.RootElement.GetProperty("message").GetString());
    }

    [Fact]
    public async Task Unfollow_NotFollowing_Returns404()
    {
        var factory = _fixture.Factory;
        var anon = factory.CreateClient();
        var (_, followerToken) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(anon, Ct);
        var (targetId, _) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(anon, Ct);

        var follower = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, followerToken);
        using var response = await SocialIntegrationTestHelpers.UnfollowUserAsync(follower, targetId, Ct);
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetFollowers_ReturnsFollowers_AndPagination()
    {
        var factory = _fixture.Factory;
        var anon = factory.CreateClient();
        var (targetId, targetToken) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(anon, Ct);
        var (_, f1Token) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(anon, Ct);
        var (_, f2Token) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(anon, Ct);

        var c1 = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, f1Token);
        var c2 = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, f2Token);
        await SocialIntegrationTestHelpers.FollowUserAsync(c1, targetId, Ct);
        await SocialIntegrationTestHelpers.FollowUserAsync(c2, targetId, Ct);

        var viewer = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, targetToken);
        using var response = await viewer.GetAsync($"/api/follow/{targetId}/followers?page=1&limit=1", Ct);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        await using var stream = await response.Content.ReadAsStreamAsync(Ct);
        var doc = await JsonDocument.ParseAsync(stream, default, Ct);
        Assert.Equal(1, doc.RootElement.GetProperty("followers").GetArrayLength());
        Assert.Equal(2, doc.RootElement.GetProperty("pagination").GetProperty("total").GetInt32());
        Assert.Equal(2, doc.RootElement.GetProperty("pagination").GetProperty("pages").GetInt32());
    }

    [Fact]
    public async Task GetFollowing_ReturnsFollowing()
    {
        var factory = _fixture.Factory;
        var anon = factory.CreateClient();
        var (followerId, followerToken) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(anon, Ct);
        var (targetId, _) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(anon, Ct);

        var follower = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, followerToken);
        await SocialIntegrationTestHelpers.FollowUserAsync(follower, targetId, Ct);

        using var response = await follower.GetAsync($"/api/follow/{followerId}/following", Ct);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        await using var stream = await response.Content.ReadAsStreamAsync(Ct);
        var doc = await JsonDocument.ParseAsync(stream, default, Ct);
        Assert.Equal(1, doc.RootElement.GetProperty("following").GetArrayLength());
        Assert.Equal(targetId, doc.RootElement.GetProperty("following")[0].GetProperty("user").GetProperty("id").GetGuid());
    }

    [Fact]
    public async Task GetFollowStatus_ReturnsIsFollowing_AndFollowId()
    {
        var factory = _fixture.Factory;
        var anon = factory.CreateClient();
        var (_, followerToken) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(anon, Ct);
        var (targetId, _) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(anon, Ct);

        var follower = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, followerToken);
        using var followResp = await SocialIntegrationTestHelpers.FollowUserAsync(follower, targetId, Ct);
        Assert.Equal(HttpStatusCode.OK, followResp.StatusCode);
        await using var followStream = await followResp.Content.ReadAsStreamAsync(Ct);
        var followDoc = await JsonDocument.ParseAsync(followStream, default, Ct);
        var followRowId = followDoc.RootElement.GetProperty("follow").GetProperty("id").GetGuid();

        using var status = await follower.GetAsync($"/api/follow/{targetId}/status", Ct);
        Assert.Equal(HttpStatusCode.OK, status.StatusCode);
        await using var stream = await status.Content.ReadAsStreamAsync(Ct);
        var doc = await JsonDocument.ParseAsync(stream, default, Ct);
        Assert.True(doc.RootElement.GetProperty("isFollowing").GetBoolean());
        Assert.Equal(followRowId, doc.RootElement.GetProperty("followId").GetGuid());
    }

    [Fact]
    public async Task GetFollowStats_ReturnsCounts()
    {
        var factory = _fixture.Factory;
        var anon = factory.CreateClient();
        var (targetId, targetToken) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(anon, Ct);
        var (_, followerToken) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(anon, Ct);

        var follower = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, followerToken);
        await SocialIntegrationTestHelpers.FollowUserAsync(follower, targetId, Ct);

        var viewer = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, targetToken);
        using var response = await viewer.GetAsync($"/api/follow/{targetId}/stats", Ct);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        await using var stream = await response.Content.ReadAsStreamAsync(Ct);
        var doc = await JsonDocument.ParseAsync(stream, default, Ct);
        Assert.Equal(1, doc.RootElement.GetProperty("followersCount").GetInt32());
        Assert.Equal(0, doc.RootElement.GetProperty("followingCount").GetInt32());
    }
}
