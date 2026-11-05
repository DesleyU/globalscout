using System.Collections.Concurrent;
using System.Net.Http.Json;
using System.Text.Json;
using GlobalScout.Domain.Social;
using GlobalScout.Infrastructure.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

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
            .Where(m => m.ConversationId == conversation.Id)
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
            .Where(m => m.SenderId == userA || m.SenderId == userB)
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

    [Fact]
    public async Task Inbox_is_ordered_by_latest_activity()
    {
        var (userA, clientA, userB, clientB) = await CreateConnectedPairAsync();
        var (userC, clientC) = await ConnectNewUserToAsync(clientA, userA);

        await SendAsync(clientA, userB, "A to B");
        await SendAsync(clientC, userA, "C to A");
        Assert.Equal([userC, userB], (await GetInboxAsync(clientA)).Select(OtherUserId));

        await SendAsync(clientB, userA, "B to A");
        Assert.Equal([userB, userC], (await GetInboxAsync(clientA)).Select(OtherUserId));
    }

    [Fact]
    public async Task Inbox_previews_the_newest_message_in_either_direction()
    {
        var (userA, clientA, userB, clientB) = await CreateConnectedPairAsync();
        await SendAsync(clientA, userB, "first");
        await SendAsync(clientB, userA, "second");

        var itemForA = Assert.Single(await GetInboxAsync(clientA));
        var lastForA = itemForA.GetProperty("lastMessage");
        Assert.Equal("second", lastForA.GetProperty("content").GetString());
        Assert.Equal(userB, lastForA.GetProperty("senderId").GetGuid());
        Assert.Equal(userA, lastForA.GetProperty("receiverId").GetGuid());
        Assert.False(lastForA.GetProperty("isRead").GetBoolean());

        // B sees the same last message; it flips to read once A (its receiver) reads the conversation.
        await MarkReadAsync(clientA, userB);
        var lastForB = Assert.Single(await GetInboxAsync(clientB)).GetProperty("lastMessage");
        Assert.Equal("second", lastForB.GetProperty("content").GetString());
        Assert.True(lastForB.GetProperty("isRead").GetBoolean());
    }

    [Fact]
    public async Task Inbox_items_carry_the_conversation_id()
    {
        var (userA, clientA, userB, _) = await CreateConnectedPairAsync();
        await SendAsync(clientA, userB, "hello");

        await using var scope = _fixture.Factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<GlobalScoutDbContext>();
        var (user1Id, user2Id) = Conversation.OrderPair(userA, userB);
        var conversationId = await db.Conversations.AsNoTracking()
            .Where(c => c.User1Id == user1Id && c.User2Id == user2Id)
            .Select(c => c.Id)
            .SingleAsync(Ct);

        var item = Assert.Single(await GetInboxAsync(clientA));
        Assert.Equal(userB, item.GetProperty("id").GetGuid());
        Assert.Equal(conversationId, item.GetProperty("conversationId").GetGuid());
    }

    [Fact]
    public async Task Inbox_is_empty_without_conversations()
    {
        var (_, _, _, clientB) = await CreateConnectedPairAsync();

        Assert.Empty(await GetInboxAsync(clientB));
    }

    [Fact]
    public async Task Inbox_only_contains_the_callers_conversations()
    {
        var (userA, clientA, userB, clientB) = await CreateConnectedPairAsync();
        var (userC, clientC) = await ConnectNewUserToAsync(clientB, userB);

        await SendAsync(clientA, userB, "A to B");
        await SendAsync(clientC, userB, "C to B");

        Assert.Equal([userB], (await GetInboxAsync(clientA)).Select(OtherUserId));
        Assert.Equal([userB], (await GetInboxAsync(clientC)).Select(OtherUserId));
        Assert.Equal([userC, userA], (await GetInboxAsync(clientB)).Select(OtherUserId));
    }

    [Fact]
    public async Task Thread_first_page_returns_newest_messages_oldest_to_newest()
    {
        var (userA, clientA, userB, clientB) = await CreateConnectedPairAsync();
        for (int i = 0; i < 5; i++)
        {
            await SendAsync(clientA, userB, $"m{i}");
        }

        var (messages, _, hasMore) = await GetThreadPageAsync(clientA, userB, before: null, limit: 3);

        Assert.True(hasMore);
        Assert.Equal(["m2", "m3", "m4"], messages.Select(m => m.GetProperty("content").GetString()));
    }

    [Fact]
    public async Task Thread_cursor_pages_cover_full_history_without_duplicates_or_gaps()
    {
        var (userA, clientA, userB, clientB) = await CreateConnectedPairAsync();
        var sent = new List<string>();
        for (int i = 0; i < 7; i++)
        {
            sent.Add($"m{i}");
            await SendAsync(clientA, userB, $"m{i}");
        }

        var collected = new List<string>();
        string? cursor = null;
        bool hasMore = true;
        while (hasMore)
        {
            var (messages, nextCursor, more) = await GetThreadPageAsync(clientA, userB, cursor, limit: 3);
            collected.InsertRange(0, messages.Select(m => m.GetProperty("content").GetString()!));
            cursor = nextCursor;
            hasMore = more;
        }

        Assert.Equal(sent, collected);
    }

    [Fact]
    public async Task Thread_hasMore_is_correct_on_an_exact_page_boundary()
    {
        var (userA, clientA, userB, clientB) = await CreateConnectedPairAsync();
        for (int i = 0; i < 4; i++)
        {
            await SendAsync(clientA, userB, $"m{i}");
        }

        var (firstPage, nextCursor, hasMore) = await GetThreadPageAsync(clientA, userB, before: null, limit: 4);
        Assert.False(hasMore);
        Assert.Null(nextCursor);
        Assert.Equal(4, firstPage.Count);
    }

    [Fact]
    public async Task Thread_pages_are_stable_when_new_messages_arrive_between_requests()
    {
        var (userA, clientA, userB, clientB) = await CreateConnectedPairAsync();
        for (int i = 0; i < 3; i++)
        {
            await SendAsync(clientA, userB, $"m{i}");
        }

        var (firstPage, nextCursor, hasMore) = await GetThreadPageAsync(clientA, userB, before: null, limit: 2);
        Assert.True(hasMore);

        // A new message arrives after the first page was fetched but before the next page is requested.
        await SendAsync(clientA, userB, "late");

        var (olderPage, _, _) = await GetThreadPageAsync(clientA, userB, nextCursor, limit: 2);
        Assert.Equal(["m0"], olderPage.Select(m => m.GetProperty("content").GetString()));
    }

    [Fact]
    public async Task Thread_invalid_cursor_returns_validation_error()
    {
        var (_, clientA, userB, _) = await CreateConnectedPairAsync();

        using var response = await clientA.GetAsync($"/api/messages/conversation/{userB}?before=not-a-cursor", Ct);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Thread_with_no_conversation_returns_empty_page()
    {
        var (_, clientA, userB, _) = await CreateConnectedPairAsync();

        var (messages, nextCursor, hasMore) = await GetThreadPageAsync(clientA, userB, before: null, limit: 30);

        Assert.Empty(messages);
        Assert.Null(nextCursor);
        Assert.False(hasMore);
    }

    [Fact]
    public async Task Inbox_query_count_does_not_grow_with_conversations()
    {
        var sql = new SqlCommandCollector();
        await using var factory = _fixture.Factory.WithWebHostBuilder(builder =>
            builder.ConfigureLogging(logging =>
            {
                logging.AddProvider(sql);
                logging.AddFilter<SqlCommandCollector>(DbLoggerCategory.Database.Command.Name, LogLevel.Information);
            }));

        var (userA, tokenA) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(factory, Ct);
        var clientA = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, tokenA);

        async Task AddConversationAsync()
        {
            var (userId, token) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(factory, Ct);
            var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, token);
            var connectionId = await SocialIntegrationTestHelpers.SendConnectionRequestAsync(clientA, userId, Ct);
            using var accept = await SocialIntegrationTestHelpers.RespondToConnectionAsync(client, connectionId, "accept", Ct);
            accept.EnsureSuccessStatusCode();
            await SendAsync(client, userA, "hi");
        }

        async Task<IReadOnlyList<string>> CommandsForInboxAsync()
        {
            sql.Clear();
            await GetInboxAsync(clientA);
            return sql.Commands;
        }

        await AddConversationAsync();
        var withOne = await CommandsForInboxAsync();

        await AddConversationAsync();
        await AddConversationAsync();
        var withThree = await CommandsForInboxAsync();

        TestContext.Current.TestOutputHelper?.WriteLine(string.Join("\n\n", withThree));
        Assert.Equal(3, (await GetInboxAsync(clientA)).Count);
        Assert.Equal(withOne.Count, withThree.Count);
    }

    private static Guid OtherUserId(JsonElement inboxItem) => inboxItem.GetProperty("otherUser").GetProperty("id").GetGuid();

    private async Task<List<JsonElement>> GetInboxAsync(HttpClient client)
    {
        using var response = await client.GetAsync("/api/messages/conversations", Ct);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync(Ct));
        return doc.RootElement.GetProperty("conversations").EnumerateArray().Select(c => c.Clone()).ToList();
    }

    /// <summary>Registers a new user and connects them with an existing one (existing user sends, new user accepts).</summary>
    private async Task<(Guid UserId, HttpClient Client)> ConnectNewUserToAsync(HttpClient existingClient, Guid existingUserId)
    {
        var factory = _fixture.Factory;
        var (userId, token) = await SocialIntegrationTestHelpers.RegisterClubUserAsync(factory, Ct);
        var client = SocialIntegrationTestHelpers.CreateAuthenticatedClient(factory, token);

        var connectionId = await SocialIntegrationTestHelpers.SendConnectionRequestAsync(existingClient, userId, Ct);
        using var accept = await SocialIntegrationTestHelpers.RespondToConnectionAsync(client, connectionId, "accept", Ct);
        accept.EnsureSuccessStatusCode();

        return (userId, client);
    }

    private async Task<List<JsonElement>> GetThreadAsync(HttpClient client, Guid otherUserId)
    {
        using var response = await client.GetAsync($"/api/messages/conversation/{otherUserId}", Ct);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync(Ct));
        return doc.RootElement.GetProperty("messages").EnumerateArray().Select(m => m.Clone()).ToList();
    }

    private async Task<(List<JsonElement> Messages, string? NextCursor, bool HasMore)> GetThreadPageAsync(
        HttpClient client,
        Guid otherUserId,
        string? before,
        int limit)
    {
        var query = before is null ? $"?limit={limit}" : $"?before={Uri.EscapeDataString(before)}&limit={limit}";
        using var response = await client.GetAsync($"/api/messages/conversation/{otherUserId}{query}", Ct);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync(Ct));
        var messages = doc.RootElement.GetProperty("messages").EnumerateArray().Select(m => m.Clone()).ToList();
        var nextCursor = doc.RootElement.GetProperty("nextCursor").ValueKind == JsonValueKind.Null
            ? null
            : doc.RootElement.GetProperty("nextCursor").GetString();
        var hasMore = doc.RootElement.GetProperty("hasMore").GetBoolean();
        return (messages, nextCursor, hasMore);
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

    /// <summary>Records the SQL of every command EF Core executes.</summary>
    private sealed class SqlCommandCollector : ILoggerProvider
    {
        private readonly ConcurrentQueue<string> _commands = new();

        public IReadOnlyList<string> Commands => _commands.ToArray();

        public void Clear() => _commands.Clear();

        public ILogger CreateLogger(string categoryName) =>
            categoryName == DbLoggerCategory.Database.Command.Name ? new CommandLogger(_commands) : NullLogger.Instance;

        public void Dispose()
        {
        }

        private sealed class CommandLogger(ConcurrentQueue<string> commands) : ILogger
        {
            public IDisposable? BeginScope<TState>(TState state)
                where TState : notnull => null;

            public bool IsEnabled(LogLevel logLevel) => true;

            public void Log<TState>(
                LogLevel logLevel,
                EventId eventId,
                TState state,
                Exception? exception,
                Func<TState, Exception?, string> formatter)
            {
                if (eventId.Id == RelationalEventId.CommandExecuted.Id)
                {
                    commands.Enqueue(formatter(state, exception));
                }
            }
        }
    }
}
