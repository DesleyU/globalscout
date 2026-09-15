using System.Net.Http.Json;
using System.Text.Json;
using GlobalScout.Domain.Identity;

namespace GlobalScout.Api.IntegrationTests.Social;

// NOTE: Follow is now role-restricted (Player-Player and Agent-Player only, see FollowEligibility).
// Tests below that exercise generic follow mechanics (not role rules themselves) use two Players,
// an allowed pairing, so they continue to validate those mechanics independent of role restrictions.
// Role-restriction behavior itself is covered by the dedicated tests further down this file.

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
        var (_, followerToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);
        var (targetId, _) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);

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
        var (userId, token) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);
        var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, token);

        using var response = await SocialIntegrationTestHelpers.FollowUserAsync(client, userId, Ct);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Follow_UserNotFound_Returns404()
    {
        var factory = _fixture.Factory;
        var anon = factory.CreateClient();
        var (_, token) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);
        var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, token);

        using var response = await SocialIntegrationTestHelpers.FollowUserAsync(client, Guid.NewGuid(), Ct);
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Follow_AlreadyFollowing_Returns400()
    {
        var factory = _fixture.Factory;
        var anon = factory.CreateClient();
        var (_, followerToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);
        var (targetId, _) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);

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
        var (_, followerToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);
        var (targetId, _) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);

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
        var (_, followerToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);
        var (targetId, _) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);

        var follower = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, followerToken);
        using var response = await SocialIntegrationTestHelpers.UnfollowUserAsync(follower, targetId, Ct);
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetFollowers_ReturnsFollowers_AndPagination()
    {
        var factory = _fixture.Factory;
        var anon = factory.CreateClient();
        var (targetId, targetToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);
        var (_, f1Token) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);
        var (_, f2Token) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);

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
        var (followerId, followerToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);
        var (targetId, _) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);

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
        var (_, followerToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);
        var (targetId, _) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);

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
        var (targetId, targetToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);
        var (_, followerToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);

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

    [Fact]
    public async Task Follow_AgentFollowsPlayer_Returns200()
    {
        var factory = _fixture.Factory;
        var (_, agentToken) = await SocialIntegrationTestHelpers.RegisterScoutAgentUserAsync(factory, Ct);
        var (targetId, _) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);

        var agent = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, agentToken);
        using var response = await SocialIntegrationTestHelpers.FollowUserAsync(agent, targetId, Ct);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Follow_PlayerFollowsAgent_Returns400WithRoleError()
    {
        var factory = _fixture.Factory;
        var (_, playerToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);
        var (targetId, _) = await SocialIntegrationTestHelpers.RegisterScoutAgentUserAsync(factory, Ct);

        var player = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, playerToken);
        using var response = await SocialIntegrationTestHelpers.FollowUserAsync(player, targetId, Ct);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        await using var stream = await response.Content.ReadAsStreamAsync(Ct);
        var doc = await JsonDocument.ParseAsync(stream, default, Ct);
        Assert.Equal("Social.FollowRestrictedToPlayers", doc.RootElement.GetProperty("code").GetString());
    }

    [Fact]
    public async Task Follow_PlayerFollowsClub_Returns400WithRoleError()
    {
        var factory = _fixture.Factory;
        var (_, playerToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);
        var (targetId, _) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(factory, Ct);

        var player = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, playerToken);
        using var response = await SocialIntegrationTestHelpers.FollowUserAsync(player, targetId, Ct);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        await using var stream = await response.Content.ReadAsStreamAsync(Ct);
        var doc = await JsonDocument.ParseAsync(stream, default, Ct);
        Assert.Equal("Social.FollowRestrictedToPlayers", doc.RootElement.GetProperty("code").GetString());
    }

    [Fact]
    public async Task Follow_AgentFollowsAgent_Returns400WithRoleError()
    {
        var factory = _fixture.Factory;
        var (_, agentToken) = await SocialIntegrationTestHelpers.RegisterScoutAgentUserAsync(factory, Ct);
        var (targetId, _) = await SocialIntegrationTestHelpers.RegisterScoutAgentUserAsync(factory, Ct);

        var agent = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, agentToken);
        using var response = await SocialIntegrationTestHelpers.FollowUserAsync(agent, targetId, Ct);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        await using var stream = await response.Content.ReadAsStreamAsync(Ct);
        var doc = await JsonDocument.ParseAsync(stream, default, Ct);
        Assert.Equal("Social.AgentsCanOnlyFollowPlayers", doc.RootElement.GetProperty("code").GetString());
    }

    [Fact]
    public async Task Follow_PlayerFollowsAdmin_Returns400WithRoleError()
    {
        var factory = _fixture.Factory;
        var (_, playerToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);
        var (targetId, _) = await SocialIntegrationTestHelpers.RegisterAdminUserAsync(factory, Ct);

        var player = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, playerToken);
        using var response = await SocialIntegrationTestHelpers.FollowUserAsync(player, targetId, Ct);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        await using var stream = await response.Content.ReadAsStreamAsync(Ct);
        var doc = await JsonDocument.ParseAsync(stream, default, Ct);
        Assert.Equal("Social.AdminNotInFollowGraph", doc.RootElement.GetProperty("code").GetString());
    }

    [Fact]
    public async Task Follow_AdminFollowsPlayer_Returns400WithRoleError()
    {
        var factory = _fixture.Factory;
        var (_, adminToken) = await SocialIntegrationTestHelpers.RegisterAdminUserAsync(factory, Ct);
        var (targetId, _) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);

        var admin = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, adminToken);
        using var response = await SocialIntegrationTestHelpers.FollowUserAsync(admin, targetId, Ct);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        await using var stream = await response.Content.ReadAsStreamAsync(Ct);
        var doc = await JsonDocument.ParseAsync(stream, default, Ct);
        Assert.Equal("Social.AdminNotInFollowGraph", doc.RootElement.GetProperty("code").GetString());
    }

    [Fact]
    public async Task Unfollow_AllowedRegardlessOfCurrentRoleEligibility_Returns200()
    {
        // A follow created while both users were Players must still be removable even if one
        // account's role later changes such that the pairing would no longer be a NEW follow.
        var factory = _fixture.Factory;
        var (followerId, followerToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);
        var (targetId, _) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);

        var follower = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, followerToken);
        await SocialIntegrationTestHelpers.FollowUserAsync(follower, targetId, Ct);

        await SocialIntegrationTestHelpers.AssignRoleAsync(factory, targetId, AppRoleNames.ScoutAgent, Ct);

        using var response = await SocialIntegrationTestHelpers.UnfollowUserAsync(follower, targetId, Ct);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
