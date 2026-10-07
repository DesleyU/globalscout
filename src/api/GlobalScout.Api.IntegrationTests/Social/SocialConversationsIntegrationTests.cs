using System.Net.Http.Json;
using System.Text.Json;
using GlobalScout.Domain.Social;
using GlobalScout.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace GlobalScout.Api.IntegrationTests.Social;

[Collection(nameof(IntegrationCollection))]
public sealed class SocialConversationsIntegrationTests
{
    private readonly IntegrationTestFixture _fixture;

    public SocialConversationsIntegrationTests(IntegrationTestFixture fixture) => _fixture = fixture;

    private CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task Messages_in_both_directions_share_one_normalized_conversation()
    {
        var (userA, clientA, userB, clientB) = await CreateConnectedPairAsync();

        await SendAsync(clientA, userB, "A to B");
        await SendAsync(clientB, userA, "B to A");

        await using var scope = _fixture.Factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<GlobalScoutDbContext>();

        var (user1Id, user2Id) = Conversation.OrderPair(userA, userB);
        var conversation = await db.Conversations.AsNoTracking()
            .SingleAsync(c => c.User1Id == user1Id && c.User2Id == user2Id, Ct);

        var messages = await db.Messages.AsNoTracking()
            .Where(m => (m.SenderId == userA && m.ReceiverId == userB) || (m.SenderId == userB && m.ReceiverId == userA))
            .ToListAsync(Ct);

        Assert.Equal(2, messages.Count);
        Assert.All(messages, m => Assert.Equal(conversation.Id, m.ConversationId));
        Assert.Equal(messages.Max(m => m.CreatedAt), conversation.LastMessageAt);
    }

    [Fact]
    public async Task Concurrent_first_messages_create_exactly_one_conversation()
    {
        var (userA, clientA, userB, clientB) = await CreateConnectedPairAsync();

        var sends = Enumerable.Range(0, 10)
            .Select(i => i % 2 == 0
                ? SendAsync(clientA, userB, $"A {i}")
                : SendAsync(clientB, userA, $"B {i}"));
        await Task.WhenAll(sends);

        await using var scope = _fixture.Factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<GlobalScoutDbContext>();

        var (user1Id, user2Id) = Conversation.OrderPair(userA, userB);
        var conversationIds = await db.Conversations.AsNoTracking()
            .Where(c => c.User1Id == user1Id && c.User2Id == user2Id)
            .Select(c => c.Id)
            .ToListAsync(Ct);
        var messageConversationIds = await db.Messages.AsNoTracking()
            .Where(m => (m.SenderId == userA && m.ReceiverId == userB) || (m.SenderId == userB && m.ReceiverId == userA))
            .Select(m => m.ConversationId)
            .ToListAsync(Ct);

        var conversationId = Assert.Single(conversationIds);
        Assert.Equal(10, messageConversationIds.Count);
        Assert.All(messageConversationIds, id => Assert.Equal(conversationId, id));
    }

    /// <summary>
    /// <see cref="Conversation.OrderPair"/> relies on <see cref="Guid.CompareTo(Guid)"/> agreeing with
    /// PostgreSQL <c>uuid</c> ordering; otherwise inserts would violate <c>ck_conversations_user_order</c>.
    /// </summary>
    [Fact]
    public async Task Guid_ordering_matches_postgres_uuid_ordering()
    {
        const int pairs = 2000;
        var lefts = Enumerable.Range(0, pairs).Select(_ => Guid.NewGuid()).ToArray();
        var rights = Enumerable.Range(0, pairs).Select(_ => Guid.NewGuid()).ToArray();

        await using var scope = _fixture.Factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<GlobalScoutDbContext>();

        var postgresLess = await db.Database
            .SqlQuery<bool>(
                $"""
                 SELECT t.a < t.b AS "Value"
                 FROM unnest({lefts}, {rights}) WITH ORDINALITY AS t(a, b, n)
                 ORDER BY t.n
                 """)
            .ToListAsync(Ct);

        Assert.Equal(pairs, postgresLess.Count);
        for (var i = 0; i < pairs; i++)
        {
            Assert.Equal(lefts[i].CompareTo(rights[i]) < 0, postgresLess[i]);
        }
    }

    [Fact]
    public async Task Loading_a_thread_does_not_mark_it_read()
    {
        var (userA, clientA, userB, clientB) = await CreateConnectedPairAsync();
        await SendAsync(clientA, userB, "one");
        await SendAsync(clientA, userB, "two");

        var thread = await GetThreadAsync(clientB, userA);

        Assert.All(thread, m => Assert.False(m.GetProperty("isRead").GetBoolean()));
        Assert.Equal(2, await GetUnreadCountAsync(clientB, userA));
    }

    [Fact]
    public async Task Marking_read_moves_only_the_callers_position()
    {
        var (userA, clientA, userB, clientB) = await CreateConnectedPairAsync();
        await SendAsync(clientA, userB, "from A");
        await SendAsync(clientB, userA, "from B");

        await MarkReadAsync(clientB, userA);

        Assert.Equal(0, await GetUnreadCountAsync(clientB, userA));
        Assert.Equal(1, await GetUnreadCountAsync(clientA, userB));

        var thread = await GetThreadAsync(clientA, userB);
        Assert.True(thread.Single(m => m.GetProperty("senderId").GetGuid() == userA).GetProperty("isRead").GetBoolean());
        Assert.False(thread.Single(m => m.GetProperty("senderId").GetGuid() == userB).GetProperty("isRead").GetBoolean());
    }

    [Fact]
    public async Task Messages_after_the_read_position_stay_unread()
    {
        var (userA, clientA, userB, clientB) = await CreateConnectedPairAsync();
        await SendAsync(clientA, userB, "before");
        await MarkReadAsync(clientB, userA);

        await SendAsync(clientA, userB, "after");

        Assert.Equal(1, await GetUnreadCountAsync(clientB, userA));
        var thread = await GetThreadAsync(clientB, userA);
        Assert.False(thread.Single(m => m.GetProperty("content").GetString() == "after").GetProperty("isRead").GetBoolean());
        Assert.True(thread.Single(m => m.GetProperty("content").GetString() == "before").GetProperty("isRead").GetBoolean());
    }

    [Fact]
    public async Task Marking_read_without_a_conversation_succeeds()
    {
        var (userA, _, _, clientB) = await CreateConnectedPairAsync();

        await MarkReadAsync(clientB, userA);
    }

    private async Task<List<JsonElement>> GetThreadAsync(HttpClient client, Guid otherUserId)
    {
        using var response = await client.GetAsync($"/api/messages/conversation/{otherUserId}", Ct);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync(Ct));
        return doc.RootElement.GetProperty("messages").EnumerateArray().Select(m => m.Clone()).ToList();
    }

    private async Task<int> GetUnreadCountAsync(HttpClient client, Guid otherUserId)
    {
        using var response = await client.GetAsync("/api/messages/conversations", Ct);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync(Ct));
        return doc.RootElement.GetProperty("conversations").EnumerateArray()
            .Single(c => c.GetProperty("otherUser").GetProperty("id").GetGuid() == otherUserId)
            .GetProperty("unreadCount").GetInt32();
    }

    private async Task MarkReadAsync(HttpClient client, Guid otherUserId)
    {
        using var response = await client.PutAsync($"/api/messages/read/{otherUserId}", null, Ct);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    private async Task<(Guid UserA, HttpClient ClientA, Guid UserB, HttpClient ClientB)> CreateConnectedPairAsync()
    {
        var factory = _fixture.Factory;
        var (userA, tokenA) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(factory, Ct);
        var (userB, tokenB) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(factory, Ct);

        var clientA = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, tokenA);
        var clientB = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, tokenB);

        var connectionId = await SocialIntegrationTestHelpers.SendConnectionRequestAsync(clientA, userB, Ct);
        using var accept = await SocialIntegrationTestHelpers.RespondToConnectionAsync(clientB, connectionId, "accept", Ct);
        accept.EnsureSuccessStatusCode();

        return (userA, clientA, userB, clientB);
    }

    private async Task SendAsync(HttpClient client, Guid receiverId, string content)
    {
        using var response = await client.PostAsJsonAsync("/api/messages", new { receiverId, content }, Ct);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }
}
