using System.Net.Http.Json;
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
