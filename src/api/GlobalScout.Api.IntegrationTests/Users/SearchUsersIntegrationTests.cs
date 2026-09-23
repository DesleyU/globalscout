using System.Text.Json;
using GlobalScout.Api.IntegrationTests.Social;

namespace GlobalScout.Api.IntegrationTests.Users;

[Collection(nameof(IntegrationCollection))]
public sealed class SearchUsersIntegrationTests
{
    private readonly IntegrationTestFixture _fixture;

    public SearchUsersIntegrationTests(IntegrationTestFixture fixture) => _fixture = fixture;

    private CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task Search_Unauthorized_Returns401()
    {
        var client = _fixture.Factory.CreateClient();
        using var response = await client.GetAsync("/api/users/search", Ct);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Search_AsPlayer_OnlyReturnsPlayers_EvenWhenRoleParamRequestsOtherRole()
    {
        var factory = _fixture.Factory;
        var (_, callerToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);
        var (playerTargetId, _) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);
        var (clubTargetId, _) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(factory, Ct);
        var (agentTargetId, _) = await SocialIntegrationTestHelpers.RegisterScoutAgentUserAsync(factory, Ct);

        var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, callerToken);
        var ids = await UsersIntegrationTestHelpers.SearchResultIdsAsync(client, "?role=CLUB&limit=100", Ct);

        Assert.Contains(playerTargetId, ids);
        Assert.DoesNotContain(clubTargetId, ids);
        Assert.DoesNotContain(agentTargetId, ids);
    }

    [Fact]
    public async Task Search_AsAgent_OnlyReturnsPlayers_EvenWhenRoleParamRequestsOtherRole()
    {
        var factory = _fixture.Factory;
        var (_, callerToken) = await SocialIntegrationTestHelpers.RegisterScoutAgentUserAsync(factory, Ct);
        var (playerTargetId, _) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);
        var (clubTargetId, _) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(factory, Ct);
        var (agentTargetId, _) = await SocialIntegrationTestHelpers.RegisterScoutAgentUserAsync(factory, Ct);

        var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, callerToken);
        var ids = await UsersIntegrationTestHelpers.SearchResultIdsAsync(client, "?role=SCOUT_AGENT&limit=100", Ct);

        Assert.Contains(playerTargetId, ids);
        Assert.DoesNotContain(clubTargetId, ids);
        Assert.DoesNotContain(agentTargetId, ids);
    }

    [Fact]
    public async Task Search_ByFreeTextSearch_MatchesFirstOrLastName_CaseInsensitivePartial()
    {
        var factory = _fixture.Factory;
        var (_, callerToken) = await SocialIntegrationTestHelpers.RegisterScoutAgentUserAsync(factory, Ct);
        var (targetId, targetToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);
        var (otherId, otherToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);

        var targetClient = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, targetToken);
        await UsersIntegrationTestHelpers.UpdateProfileAsync(
            targetClient, new { lastName = "Zlatanovic" }, Ct);
        var otherClient = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, otherToken);
        await UsersIntegrationTestHelpers.UpdateProfileAsync(
            otherClient, new { lastName = "Johansson" }, Ct);

        var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, callerToken);
        var ids = await UsersIntegrationTestHelpers.SearchResultIdsAsync(client, "?search=zlatanov", Ct);

        Assert.Contains(targetId, ids);
        Assert.DoesNotContain(otherId, ids);
    }

    [Fact]
    public async Task Search_ByPosition_FiltersToMatchingPositionOnly()
    {
        var factory = _fixture.Factory;
        var (_, callerToken) = await SocialIntegrationTestHelpers.RegisterScoutAgentUserAsync(factory, Ct);
        var (forwardId, forwardToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);
        var (goalkeeperId, goalkeeperToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);

        await UsersIntegrationTestHelpers.UpdateProfileAsync(
            SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, forwardToken),
            new { position = "FORWARD" },
            Ct);
        await UsersIntegrationTestHelpers.UpdateProfileAsync(
            SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, goalkeeperToken),
            new { position = "GOALKEEPER" },
            Ct);

        var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, callerToken);
        var ids = await UsersIntegrationTestHelpers.SearchResultIdsAsync(client, "?position=FORWARD&limit=100", Ct);

        Assert.Contains(forwardId, ids);
        Assert.DoesNotContain(goalkeeperId, ids);
    }

    [Fact]
    public async Task Search_ByCountry_MatchesPartialCaseInsensitive()
    {
        var factory = _fixture.Factory;
        var (_, callerToken) = await SocialIntegrationTestHelpers.RegisterScoutAgentUserAsync(factory, Ct);
        var (targetId, targetToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);
        var (otherId, otherToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);

        await UsersIntegrationTestHelpers.UpdateProfileAsync(
            SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, targetToken),
            new { country = "Sweden" },
            Ct);
        await UsersIntegrationTestHelpers.UpdateProfileAsync(
            SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, otherToken),
            new { country = "Norway" },
            Ct);

        var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, callerToken);
        var ids = await UsersIntegrationTestHelpers.SearchResultIdsAsync(client, "?country=swed&limit=100", Ct);

        Assert.Contains(targetId, ids);
        Assert.DoesNotContain(otherId, ids);
    }

    [Fact]
    public async Task Search_ByAgeRange_FiltersCorrectly()
    {
        var factory = _fixture.Factory;
        var (_, callerToken) = await SocialIntegrationTestHelpers.RegisterScoutAgentUserAsync(factory, Ct);
        var (inRangeId, inRangeToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);
        var (outOfRangeId, outOfRangeToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);

        await UsersIntegrationTestHelpers.UpdateProfileAsync(
            SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, inRangeToken),
            new { age = 22 },
            Ct);
        await UsersIntegrationTestHelpers.UpdateProfileAsync(
            SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, outOfRangeToken),
            new { age = 35 },
            Ct);

        var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, callerToken);
        var ids = await UsersIntegrationTestHelpers.SearchResultIdsAsync(
            client, "?minAge=20&maxAge=25&limit=100", Ct);

        Assert.Contains(inRangeId, ids);
        Assert.DoesNotContain(outOfRangeId, ids);
    }

    [Fact]
    public async Task Search_ExcludesCaller_FromOwnResults()
    {
        var factory = _fixture.Factory;
        var (callerId, callerToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);
        var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, callerToken);
        await UsersIntegrationTestHelpers.UpdateProfileAsync(client, new { lastName = "Findmyself" }, Ct);

        var ids = await UsersIntegrationTestHelpers.SearchResultIdsAsync(client, "?search=findmyself", Ct);

        Assert.DoesNotContain(callerId, ids);
    }

    [Fact]
    public async Task Search_SortByAge_OrdersCorrectly_WithUnsetAgesAlwaysLast()
    {
        var factory = _fixture.Factory;
        var (_, callerToken) = await SocialIntegrationTestHelpers.RegisterScoutAgentUserAsync(factory, Ct);
        var sharedLastName = $"Sorttest{Guid.NewGuid():N}"[..20];

        var (youngId, youngToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);
        var (oldId, oldToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);
        var (noAgeId, noAgeToken) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);

        await UsersIntegrationTestHelpers.UpdateProfileAsync(
            SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, youngToken),
            new { lastName = sharedLastName, age = 20 },
            Ct);
        await UsersIntegrationTestHelpers.UpdateProfileAsync(
            SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, oldToken),
            new { lastName = sharedLastName, age = 35 },
            Ct);
        await UsersIntegrationTestHelpers.UpdateProfileAsync(
            SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, noAgeToken),
            new { lastName = sharedLastName },
            Ct);

        var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, callerToken);

        var ascendingIds = await UsersIntegrationTestHelpers.SearchResultIdsAsync(
            client, $"?search={sharedLastName}&sort=age_asc&limit=100", Ct);
        Assert.Equal([youngId, oldId, noAgeId], ascendingIds);

        var descendingIds = await UsersIntegrationTestHelpers.SearchResultIdsAsync(
            client, $"?search={sharedLastName}&sort=age_desc&limit=100", Ct);
        Assert.Equal([oldId, youngId, noAgeId], descendingIds);
    }

    [Fact]
    public async Task Search_Pagination_ReturnsCorrectTotalAndPages()
    {
        var factory = _fixture.Factory;
        var (_, callerToken) = await SocialIntegrationTestHelpers.RegisterScoutAgentUserAsync(factory, Ct);
        var sharedLastName = $"Pagetest{Guid.NewGuid():N}"[..20];

        for (var i = 0; i < 3; i++)
        {
            var (_, token) = await SocialIntegrationTestHelpers.RegisterPlayerUserAsync(factory, Ct);
            await UsersIntegrationTestHelpers.UpdateProfileAsync(
                SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, token),
                new { lastName = sharedLastName },
                Ct);
        }

        var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, callerToken);
        using var page1 = await client.GetAsync($"/api/users/search?search={sharedLastName}&limit=2&page=1", Ct);
        page1.EnsureSuccessStatusCode();
        await using var page1Stream = await page1.Content.ReadAsStreamAsync(Ct);
        var page1Doc = await JsonDocument.ParseAsync(page1Stream, default, Ct);
        var page1Pagination = page1Doc.RootElement.GetProperty("pagination");

        Assert.Equal(3, page1Pagination.GetProperty("total").GetInt32());
        Assert.Equal(2, page1Pagination.GetProperty("pages").GetInt32());
        Assert.Equal(2, page1Doc.RootElement.GetProperty("users").GetArrayLength());

        var page2Ids = await UsersIntegrationTestHelpers.SearchResultIdsAsync(
            client, $"?search={sharedLastName}&limit=2&page=2", Ct);
        Assert.Single(page2Ids);
    }
}
