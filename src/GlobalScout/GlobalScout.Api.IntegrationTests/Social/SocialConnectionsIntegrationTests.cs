using System.Net.Http.Json;
using System.Text.Json;

namespace GlobalScout.Api.IntegrationTests.Social;

[Collection(nameof(IntegrationCollection))]
public sealed class SocialConnectionsIntegrationTests
{
    private readonly IntegrationTestFixture _fixture;

    public SocialConnectionsIntegrationTests(IntegrationTestFixture fixture) => _fixture = fixture;

    private CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task SendConnection_Unauthorized_Returns401()
    {
        var client = _fixture.Factory.CreateClient();
        using var response = await client.PostAsJsonAsync(
            "/api/connections/send",
            new { receiverId = Guid.NewGuid() },
            Ct);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task SendConnection_Success_Returns201_WithConnectionPayload()
    {
        var factory = _fixture.Factory;
        var anon = factory.CreateClient();
        var (senderId, senderToken) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(anon, Ct);
        var (receiverId, _) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(anon, Ct);

        var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, senderToken);
        using var response = await client.PostAsJsonAsync(
            "/api/connections/send",
            new { receiverId },
            Ct);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        await using var stream = await response.Content.ReadAsStreamAsync(Ct);
        var doc = await JsonDocument.ParseAsync(stream, default, Ct);
        var conn = doc.RootElement.GetProperty("connection");
        Assert.Equal(senderId, conn.GetProperty("sender").GetProperty("id").GetGuid());
        Assert.Equal(receiverId, conn.GetProperty("receiver").GetProperty("id").GetGuid());
        Assert.Equal("PENDING", conn.GetProperty("status").GetString());
    }

    [Fact]
    public async Task SendConnection_ToSelf_Returns400()
    {
        var factory = _fixture.Factory;
        var anon = factory.CreateClient();
        var (userId, token) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(anon, Ct);
        var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, token);

        using var response = await SocialIntegrationTestHelpers.SendConnectionRequestRawAsync(client, userId, Ct);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task SendConnection_UserNotFound_Returns404()
    {
        var factory = _fixture.Factory;
        var anon = factory.CreateClient();
        var (_, token) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(anon, Ct);
        var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, token);

        using var response = await SocialIntegrationTestHelpers.SendConnectionRequestRawAsync(client, Guid.NewGuid(), Ct);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task SendConnection_DuplicatePending_Returns400()
    {
        var factory = _fixture.Factory;
        var anon = factory.CreateClient();
        var (_, senderToken) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(anon, Ct);
        var (receiverId, _) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(anon, Ct);

        var sender = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, senderToken);
        using var first = await SocialIntegrationTestHelpers.SendConnectionRequestRawAsync(sender, receiverId, Ct);
        Assert.Equal(HttpStatusCode.Created, first.StatusCode);

        using var second = await SocialIntegrationTestHelpers.SendConnectionRequestRawAsync(sender, receiverId, Ct);
        Assert.Equal(HttpStatusCode.BadRequest, second.StatusCode);
    }

    [Fact]
    public async Task SendConnection_ReverseExists_Returns400()
    {
        var factory = _fixture.Factory;
        var anon = factory.CreateClient();
        var (aId, aToken) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(anon, Ct);
        var (bId, bToken) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(anon, Ct);

        var clientB = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, bToken);
        using var bToA = await SocialIntegrationTestHelpers.SendConnectionRequestRawAsync(clientB, aId, Ct);
        Assert.Equal(HttpStatusCode.Created, bToA.StatusCode);

        var clientA = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, aToken);
        using var aToB = await SocialIntegrationTestHelpers.SendConnectionRequestRawAsync(clientA, bId, Ct);
        Assert.Equal(HttpStatusCode.BadRequest, aToB.StatusCode);
    }

    [Fact]
    public async Task GetConnections_Unauthorized_Returns401()
    {
        var client = _fixture.Factory.CreateClient();
        using var response = await client.GetAsync("/api/connections", Ct);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Respond_Unauthorized_Returns401()
    {
        var client = _fixture.Factory.CreateClient();
        using var response = await client.PutAsJsonAsync(
            $"/api/connections/{Guid.NewGuid()}/respond",
            new { action = "accept" },
            Ct);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Respond_Accept_Returns200_AndListsAccepted()
    {
        var factory = _fixture.Factory;
        var anon = factory.CreateClient();
        var (_, senderToken) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(anon, Ct);
        var (receiverId, receiverToken) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(anon, Ct);

        var sender = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, senderToken);
        var connectionId = await SocialIntegrationTestHelpers.SendConnectionRequestAsync(sender, receiverId, Ct);

        var receiver = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, receiverToken);
        using var respond = await SocialIntegrationTestHelpers.RespondToConnectionAsync(receiver, connectionId, "accept", Ct);
        Assert.Equal(HttpStatusCode.OK, respond.StatusCode);

        using var listSender = await sender.GetAsync("/api/connections?status=ACCEPTED", Ct);
        Assert.Equal(HttpStatusCode.OK, listSender.StatusCode);
        await using var stream = await listSender.Content.ReadAsStreamAsync(Ct);
        var doc = await JsonDocument.ParseAsync(stream, default, Ct);
        Assert.Equal(1, doc.RootElement.GetProperty("connections").GetArrayLength());
        Assert.Equal("ACCEPTED", doc.RootElement.GetProperty("connections")[0].GetProperty("status").GetString());
    }

    [Fact]
    public async Task Respond_Reject_Returns200_AndNotInAcceptedList()
    {
        var factory = _fixture.Factory;
        var anon = factory.CreateClient();
        var (_, senderToken) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(anon, Ct);
        var (receiverId, receiverToken) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(anon, Ct);

        var sender = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, senderToken);
        var connectionId = await SocialIntegrationTestHelpers.SendConnectionRequestAsync(sender, receiverId, Ct);

        var receiver = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, receiverToken);
        using var respond = await SocialIntegrationTestHelpers.RespondToConnectionAsync(receiver, connectionId, "reject", Ct);
        Assert.Equal(HttpStatusCode.OK, respond.StatusCode);

        using var list = await sender.GetAsync("/api/connections?status=ACCEPTED", Ct);
        Assert.Equal(HttpStatusCode.OK, list.StatusCode);
        await using var stream = await list.Content.ReadAsStreamAsync(Ct);
        var doc = await JsonDocument.ParseAsync(stream, default, Ct);
        Assert.Equal(0, doc.RootElement.GetProperty("connections").GetArrayLength());
    }

    [Fact]
    public async Task Respond_NotReceiver_Returns404()
    {
        var factory = _fixture.Factory;
        var anon = factory.CreateClient();
        var (_, senderToken) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(anon, Ct);
        var (receiverId, _) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(anon, Ct);
        var (_, otherToken) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(anon, Ct);

        var sender = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, senderToken);
        var connectionId = await SocialIntegrationTestHelpers.SendConnectionRequestAsync(sender, receiverId, Ct);

        var other = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, otherToken);
        using var respond = await SocialIntegrationTestHelpers.RespondToConnectionAsync(other, connectionId, "accept", Ct);
        Assert.Equal(HttpStatusCode.NotFound, respond.StatusCode);
    }

    [Fact]
    public async Task GetPendingRequests_Unauthorized_Returns401()
    {
        var client = _fixture.Factory.CreateClient();
        using var response = await client.GetAsync("/api/connections/requests", Ct);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Respond_InvalidAction_Returns400()
    {
        var factory = _fixture.Factory;
        var anon = factory.CreateClient();
        var (_, senderToken) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(anon, Ct);
        var (receiverId, receiverToken) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(anon, Ct);

        var sender = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, senderToken);
        var connectionId = await SocialIntegrationTestHelpers.SendConnectionRequestAsync(sender, receiverId, Ct);

        var receiver = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, receiverToken);
        using var respond = await receiver.PutAsJsonAsync(
            $"/api/connections/{connectionId}/respond",
            new { action = "maybe" },
            Ct);
        Assert.Equal(HttpStatusCode.BadRequest, respond.StatusCode);
    }

    [Fact]
    public async Task GetPendingRequests_InvalidType_Returns400()
    {
        var factory = _fixture.Factory;
        var anon = factory.CreateClient();
        var (_, token) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(anon, Ct);
        var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, token);

        using var response = await client.GetAsync("/api/connections/requests?type=invalid", Ct);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetPendingRequests_Received_Vs_Sent()
    {
        var factory = _fixture.Factory;
        var anon = factory.CreateClient();
        var (_, senderToken) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(anon, Ct);
        var (receiverId, receiverToken) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(anon, Ct);

        var sender = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, senderToken);
        await SocialIntegrationTestHelpers.SendConnectionRequestAsync(sender, receiverId, Ct);

        var receiver = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, receiverToken);
        using var received = await receiver.GetAsync("/api/connections/requests?type=received", Ct);
        Assert.Equal(HttpStatusCode.OK, received.StatusCode);
        await using var rs = await received.Content.ReadAsStreamAsync(Ct);
        var receivedDoc = await JsonDocument.ParseAsync(rs, default, Ct);
        Assert.Equal(1, receivedDoc.RootElement.GetProperty("requests").GetArrayLength());

        using var sent = await sender.GetAsync("/api/connections/requests?type=sent", Ct);
        Assert.Equal(HttpStatusCode.OK, sent.StatusCode);
        await using var ss = await sent.Content.ReadAsStreamAsync(Ct);
        var sentDoc = await JsonDocument.ParseAsync(ss, default, Ct);
        Assert.Equal(1, sentDoc.RootElement.GetProperty("requests").GetArrayLength());
    }

    [Fact]
    public async Task ConnectionLimit_BasicUser_Returns403_On11thOutgoingRequest()
    {
        var factory = _fixture.Factory;
        var anon = factory.CreateClient();

        var users = new List<(Guid Id, string Token)>();
        for (var i = 0; i < 12; i++)
        {
            users.Add(await SocialIntegrationTestHelpers.RegisterClubUserAsync(anon, Ct));
        }

        var a = users[0];
        var clientA = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, a.Token);

        for (var k = 1; k <= 10; k++)
        {
            var target = users[k];
            var connectionId = await SocialIntegrationTestHelpers.SendConnectionRequestAsync(clientA, target.Id, Ct);
            var targetClient = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, target.Token);
            using var accept = await SocialIntegrationTestHelpers.RespondToConnectionAsync(targetClient, connectionId, "accept", Ct);
            Assert.Equal(HttpStatusCode.OK, accept.StatusCode);
        }

        var eleventh = users[11];
        using var limitResponse = await SocialIntegrationTestHelpers.SendConnectionRequestRawAsync(clientA, eleventh.Id, Ct);
        Assert.Equal(HttpStatusCode.Forbidden, limitResponse.StatusCode);

        await using var stream = await limitResponse.Content.ReadAsStreamAsync(Ct);
        var doc = await JsonDocument.ParseAsync(stream, default, Ct);
        var root = doc.RootElement;
        Assert.Equal("Connection limit reached", root.GetProperty("error").GetString());
        Assert.Equal(10, root.GetProperty("currentConnections").GetInt32());
        Assert.Equal(10, root.GetProperty("maxConnections").GetInt32());
        Assert.Equal("BASIC", root.GetProperty("tier").GetString());
    }
}
