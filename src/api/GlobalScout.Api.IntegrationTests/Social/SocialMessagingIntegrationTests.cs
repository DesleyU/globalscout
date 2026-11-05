using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Http.Connections;
using Microsoft.AspNetCore.SignalR.Client;

namespace GlobalScout.Api.IntegrationTests.Social;

[Collection(nameof(IntegrationCollection))]
public sealed class SocialMessagingIntegrationTests
{
    private readonly IntegrationTestFixture _fixture;

    public SocialMessagingIntegrationTests(IntegrationTestFixture fixture) => _fixture = fixture;

    private CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task SendMessage_NotConnected_Returns403()
    {
        var factory = _fixture.Factory;
        var anon = factory.CreateClient();
        var (_, senderToken) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(factory, Ct);
        var (receiverId, _) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(factory, Ct);

        var sender = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, senderToken);
        using var response = await sender.PostAsJsonAsync(
            "/api/messages",
            new { receiverId, content = "Hello" },
            Ct);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task SendMessage_AcceptedConnection_Returns201_GetConversationsAndThread()
    {
        var factory = _fixture.Factory;
        var anon = factory.CreateClient();
        var (_, senderToken) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(factory, Ct);
        var (receiverId, receiverToken) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(factory, Ct);

        var sender = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, senderToken);
        var connectionId = await SocialIntegrationTestHelpers.SendConnectionRequestAsync(sender, receiverId, Ct);

        var receiver = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, receiverToken);
        using var accept = await SocialIntegrationTestHelpers.RespondToConnectionAsync(receiver, connectionId, "accept", Ct);
        Assert.Equal(HttpStatusCode.OK, accept.StatusCode);

        using var send = await sender.PostAsJsonAsync(
            "/api/messages",
            new { receiverId, content = "Hello connected" },
            Ct);
        Assert.Equal(HttpStatusCode.Created, send.StatusCode);

        using var convSender = await sender.GetAsync("/api/messages/conversations", Ct);
        Assert.Equal(HttpStatusCode.OK, convSender.StatusCode);
        await using var convStream = await convSender.Content.ReadAsStreamAsync(Ct);
        var convDoc = await JsonDocument.ParseAsync(convStream, default, Ct);
        Assert.Equal(1, convDoc.RootElement.GetProperty("conversations").GetArrayLength());

        using var thread = await sender.GetAsync($"/api/messages/conversation/{receiverId}", Ct);
        Assert.Equal(HttpStatusCode.OK, thread.StatusCode);
        await using var threadStream = await thread.Content.ReadAsStreamAsync(Ct);
        var threadDoc = await JsonDocument.ParseAsync(threadStream, default, Ct);
        var messages = threadDoc.RootElement.GetProperty("messages");
        Assert.Equal(1, messages.GetArrayLength());
        Assert.Equal("Hello connected", messages[0].GetProperty("content").GetString());

        using var convReceiver = await receiver.GetAsync("/api/messages/conversations", Ct);
        Assert.Equal(HttpStatusCode.OK, convReceiver.StatusCode);
    }

    [Fact]
    public async Task SendMessage_WhitespaceContent_Returns400()
    {
        var factory = _fixture.Factory;
        var (_, senderToken) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(factory, Ct);
        var (receiverId, _) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(factory, Ct);

        var sender = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, senderToken);
        using var response = await sender.PostAsJsonAsync(
            "/api/messages",
            new { receiverId, content = "   " },
            Ct);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    /// <summary>
    /// Connects with the token in <c>?access_token=</c> (how browsers authenticate hubs) and verifies
    /// that <c>Clients.User(receiverId)</c> reaches the connection, i.e. the SignalR user identifier
    /// is the Global Scout user ID.
    /// </summary>
    [Fact]
    public async Task SendMessage_PushesMessageCreated_ToRecipientHubConnection()
    {
        var factory = _fixture.Factory;
        var (_, senderToken) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(factory, Ct);
        var (receiverId, receiverToken) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(factory, Ct);

        var sender = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, senderToken);
        var connectionId = await SocialIntegrationTestHelpers.SendConnectionRequestAsync(sender, receiverId, Ct);
        var receiver = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, receiverToken);
        using var accept = await SocialIntegrationTestHelpers.RespondToConnectionAsync(receiver, connectionId, "accept", Ct);
        Assert.Equal(HttpStatusCode.OK, accept.StatusCode);

        await using var hub = await ConnectHubAsync(factory, receiverToken);

        var received = new TaskCompletionSource<JsonElement>(TaskCreationOptions.RunContinuationsAsynchronously);
        hub.On<JsonElement>("MessageCreated", message => received.TrySetResult(message));
        await hub.StartAsync(Ct);

        using var send = await sender.PostAsJsonAsync(
            "/api/messages",
            new { receiverId, content = "Hello realtime" },
            Ct);
        Assert.Equal(HttpStatusCode.Created, send.StatusCode);

        var pushed = await received.Task.WaitAsync(TimeSpan.FromSeconds(10), Ct);
        Assert.Equal(receiverId, pushed.GetProperty("receiverId").GetGuid());
        Assert.Equal("Hello realtime", pushed.GetProperty("content").GetString());
    }

    /// <summary>The sender's other open tabs/connections must also see their own just-sent message.</summary>
    [Fact]
    public async Task SendMessage_PushesMessageCreated_ToSendersOtherConnection()
    {
        var factory = _fixture.Factory;
        var (senderId, senderToken) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(factory, Ct);
        var (receiverId, receiverToken) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(factory, Ct);

        var sender = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, senderToken);
        var connectionId = await SocialIntegrationTestHelpers.SendConnectionRequestAsync(sender, receiverId, Ct);
        var receiver = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, receiverToken);
        using var accept = await SocialIntegrationTestHelpers.RespondToConnectionAsync(receiver, connectionId, "accept", Ct);
        Assert.Equal(HttpStatusCode.OK, accept.StatusCode);

        await using var senderHub = await ConnectHubAsync(factory, senderToken);

        var received = new TaskCompletionSource<JsonElement>(TaskCreationOptions.RunContinuationsAsynchronously);
        senderHub.On<JsonElement>("MessageCreated", message => received.TrySetResult(message));
        await senderHub.StartAsync(Ct);

        using var send = await sender.PostAsJsonAsync(
            "/api/messages",
            new { receiverId, content = "Echo to self" },
            Ct);
        Assert.Equal(HttpStatusCode.Created, send.StatusCode);

        var pushed = await received.Task.WaitAsync(TimeSpan.FromSeconds(10), Ct);
        Assert.Equal(senderId, pushed.GetProperty("senderId").GetGuid());
        Assert.Equal("Echo to self", pushed.GetProperty("content").GetString());
    }

    [Fact]
    public async Task SendMessage_Failure_DoesNotPushMessageCreated()
    {
        var factory = _fixture.Factory;
        var (_, senderToken) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(factory, Ct);
        var (receiverId, receiverToken) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(factory, Ct);

        // No accepted connection between sender and receiver, so the send is rejected before any push.
        var sender = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, senderToken);

        await using var hub = await ConnectHubAsync(factory, receiverToken);

        var received = new TaskCompletionSource<JsonElement>(TaskCreationOptions.RunContinuationsAsynchronously);
        hub.On<JsonElement>("MessageCreated", message => received.TrySetResult(message));
        await hub.StartAsync(Ct);

        using var send = await sender.PostAsJsonAsync(
            "/api/messages",
            new { receiverId, content = "Should not arrive" },
            Ct);
        Assert.Equal(HttpStatusCode.Forbidden, send.StatusCode);

        var won = await Task.WhenAny(received.Task, Task.Delay(TimeSpan.FromSeconds(2), Ct));
        Assert.NotEqual(received.Task, won);
    }

    private static async Task<HubConnection> ConnectHubAsync(WebApplicationFactory<Program> factory, string accessToken) =>
        new HubConnectionBuilder()
            .WithUrl(
                $"{factory.Server.BaseAddress}hubs/messages?access_token={Uri.EscapeDataString(accessToken)}",
                options =>
                {
                    options.Transports = HttpTransportType.LongPolling;
                    options.HttpMessageHandlerFactory = _ => factory.Server.CreateHandler();
                })
            .Build();
}
