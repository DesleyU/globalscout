using GlobalScout.Application.Abstractions.Files;
using GlobalScout.Application.Abstractions.Social.Messages;
using GlobalScout.Application.Social.Messages;
using GlobalScout.Domain.Social;
using GlobalScout.Infrastructure.Data;
using GlobalScout.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;

namespace GlobalScout.Infrastructure.Social.Messages;

internal sealed class MessageRepository(GlobalScoutDbContext db, IAvatarUrlResolver avatarUrls) : IMessageRepository
{
    public async Task<MessageDetailDto> CreateMessageAsync(
        Guid senderId,
        Guid receiverId,
        string content,
        CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;

        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);

        Guid conversationId = await UpsertConversationAsync(senderId, receiverId, now, cancellationToken);

        var entity = new Message
        {
            Id = Guid.NewGuid(),
            ConversationId = conversationId,
            SenderId = senderId,
            Content = content,
            CreatedAt = now
        };

        db.Messages.Add(entity);
        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        var loaded = await db.Messages.AsNoTracking().FirstAsync(m => m.Id == entity.Id, cancellationToken);
        var sender = await db.Users.AsNoTracking()
            .Include(u => u.Profile)
            .FirstAsync(u => u.Id == loaded.SenderId, cancellationToken);
        var receiver = await db.Users.AsNoTracking()
            .Include(u => u.Profile)
            .FirstAsync(u => u.Id == receiverId, cancellationToken);

        return await MapDetailAsync(loaded, receiverId, sender, receiver, cancellationToken);
    }

    /// <summary>
    /// Gets or creates the pair's conversation and bumps <c>last_message_at</c> in one statement.
    /// The unique (user1_id, user2_id) index makes concurrent first messages converge on a single row;
    /// only senders in the same conversation wait on each other's row lock.
    /// </summary>
    private async Task<Guid> UpsertConversationAsync(
        Guid senderId,
        Guid receiverId,
        DateTimeOffset messageAt,
        CancellationToken cancellationToken)
    {
        (Guid user1Id, Guid user2Id) = Conversation.OrderPair(senderId, receiverId);

        List<Guid> ids = await db.Database
            .SqlQuery<Guid>(
                $"""
                 INSERT INTO conversations (id, user1_id, user2_id, created_at, last_message_at)
                 VALUES ({Guid.NewGuid()}, {user1Id}, {user2Id}, {messageAt}, {messageAt})
                 ON CONFLICT (user1_id, user2_id) DO UPDATE
                     SET last_message_at = GREATEST(conversations.last_message_at, EXCLUDED.last_message_at)
                 RETURNING id AS "Value"
                 """)
            .ToListAsync(cancellationToken);

        return ids[0];
    }

    public async Task<(IReadOnlyList<MessageThreadDto> Messages, string? NextCursor, bool HasMore)> GetConversationPageAsync(
        Guid userId,
        Guid otherUserId,
        MessageCursor? before,
        int limit,
        CancellationToken cancellationToken)
    {
        (Guid user1Id, Guid user2Id) = Conversation.OrderPair(userId, otherUserId);

        Conversation? conversation = await db.Conversations.AsNoTracking()
            .FirstOrDefaultAsync(c => c.User1Id == user1Id && c.User2Id == user2Id, cancellationToken);

        if (conversation is null)
        {
            return ([], null, false);
        }

        var query = db.Messages.AsNoTracking().Where(m => m.ConversationId == conversation.Id);

        if (before is { } cursor)
        {
            query = query.Where(m =>
                m.CreatedAt < cursor.CreatedAt
                || (m.CreatedAt == cursor.CreatedAt && m.Id < cursor.Id));
        }

        // Fetch one extra row to know whether another page follows without a second query.
        List<Message> batch = await query
            .OrderByDescending(m => m.CreatedAt)
            .ThenByDescending(m => m.Id)
            .Take(limit + 1)
            .ToListAsync(cancellationToken);

        bool hasMore = batch.Count > limit;
        if (hasMore)
        {
            batch.RemoveAt(batch.Count - 1);
        }

        if (batch.Count == 0)
        {
            return ([], null, false);
        }

        // batch is still newest-first here, so the last element is the oldest row on this page -
        // exactly the boundary the next page's `before` cursor needs.
        string? nextCursor = hasMore
            ? new MessageCursor(batch[^1].CreatedAt, batch[^1].Id).Encode()
            : null;

        batch.Reverse();

        var senderIds = batch.Select(m => m.SenderId).Distinct().ToList();
        var users = await db.Users.AsNoTracking()
            .Include(u => u.Profile)
            .Where(u => senderIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, cancellationToken);

        var messages = new List<MessageThreadDto>(batch.Count);
        foreach (var message in batch)
        {
            messages.Add(await MapThreadAsync(message, conversation, users, cancellationToken));
        }

        return (messages, nextCursor, hasMore);
    }

    public async Task<IReadOnlyList<ConversationListItemDto>> GetConversationsAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        // Query 1: the caller's conversations, each with its latest message ID and the caller's unread count.
        // "Mine" vs "other" side is picked per row; the subqueries use the (conversation_id, created_at, id) index.
        // The latest message is selected as a scalar ID on purpose: projecting the whole row makes EF emit a
        // ROW_NUMBER() window over the entire messages table instead of a per-conversation LIMIT 1 lookup.
        var rows = await db.Conversations.AsNoTracking()
            .Where(c => c.User1Id == userId || c.User2Id == userId)
            .OrderByDescending(c => c.LastMessageAt)
            .Select(c => new
            {
                ConversationId = c.Id,
                OtherUserId = c.User1Id == userId ? c.User2Id : c.User1Id,
                MyReadAt = c.User1Id == userId ? c.User1LastReadAt : c.User2LastReadAt,
                OtherReadAt = c.User1Id == userId ? c.User2LastReadAt : c.User1LastReadAt,
                LastMessageId = db.Messages
                    .Where(m => m.ConversationId == c.Id)
                    .OrderByDescending(m => m.CreatedAt)
                    .ThenByDescending(m => m.Id)
                    .Select(m => (Guid?)m.Id)
                    .FirstOrDefault(),
                UnreadCount = db.Messages.Count(m =>
                    m.ConversationId == c.Id
                    && m.SenderId != userId
                    && ((c.User1Id == userId ? c.User1LastReadAt : c.User2LastReadAt) == null
                        || m.CreatedAt > (c.User1Id == userId ? c.User1LastReadAt : c.User2LastReadAt)))
            })
            .ToListAsync(cancellationToken);

        if (rows.Count == 0)
        {
            return [];
        }

        // Query 2: those latest messages, by primary key.
        var lastMessageIds = rows.Where(r => r.LastMessageId != null).Select(r => r.LastMessageId!.Value).ToList();
        var lastMessages = await db.Messages.AsNoTracking()
            .Where(m => lastMessageIds.Contains(m.Id))
            .Select(m => new { m.Id, m.Content, m.SenderId, m.CreatedAt })
            .ToDictionaryAsync(m => m.Id, cancellationToken);

        // Query 3: the other participants, only the columns the inbox shows.
        var otherIds = rows.Select(r => r.OtherUserId).ToList();
        var partners = await db.Users.AsNoTracking()
            .Where(u => otherIds.Contains(u.Id))
            .Select(u => new
            {
                u.Id,
                u.Email,
                Profile = u.Profile == null
                    ? null
                    : new { u.Profile.FirstName, u.Profile.LastName, u.Profile.AvatarStorageKey }
            })
            .ToDictionaryAsync(u => u.Id, cancellationToken);

        var result = new List<ConversationListItemDto>(rows.Count);
        foreach (var row in rows)
        {
            // A conversation always has a message, and a missing user (deleted account) is left out.
            if (row.LastMessageId is not { } lastId
                || !lastMessages.TryGetValue(lastId, out var last)
                || !partners.TryGetValue(row.OtherUserId, out var partner))
            {
                continue;
            }

            bool sentByMe = last.SenderId == userId;
            Guid receiverId = sentByMe ? row.OtherUserId : userId;
            DateTimeOffset? receiverReadAt = sentByMe ? row.OtherReadAt : row.MyReadAt;

            result.Add(new ConversationListItemDto(
                row.OtherUserId,
                row.ConversationId,
                new ConversationLastMessageDto(
                    last.Id,
                    last.Content,
                    last.SenderId,
                    receiverId,
                    last.CreatedAt,
                    receiverReadAt is { } readAt && last.CreatedAt <= readAt),
                new ConversationPartnerDto(
                    partner.Id,
                    partner.Email ?? string.Empty,
                    partner.Profile is null
                        ? null
                        : new ConversationPartnerProfileDto(
                            partner.Profile.FirstName,
                            partner.Profile.LastName,
                            await avatarUrls.ResolveAsync(partner.Profile.AvatarStorageKey, cancellationToken))),
                row.UnreadCount));
        }

        return result;
    }

    public async Task<int> MarkMessagesReadAsync(
        Guid userId,
        Guid otherUserId,
        CancellationToken cancellationToken)
    {
        if (userId == otherUserId)
        {
            return 0;
        }

        (Guid user1Id, Guid user2Id) = Conversation.OrderPair(userId, otherUserId);

        // The read position is the newest stored message time, not "now": a message committed
        // while this request runs must stay unread.
        var target = await db.Conversations.AsNoTracking()
            .Where(c => c.User1Id == user1Id && c.User2Id == user2Id)
            .Select(c => new
            {
                c.Id,
                NewestAt = db.Messages
                    .Where(m => m.ConversationId == c.Id)
                    .Max(m => (DateTimeOffset?)m.CreatedAt)
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (target?.NewestAt is not { } newestAt)
        {
            return 0;
        }

        // Only ever moves forward, so an older concurrent request can't rewind it.
        var conversation = db.Conversations.Where(c => c.Id == target.Id);
        return userId == user1Id
            ? await conversation
                .Where(c => c.User1LastReadAt == null || c.User1LastReadAt < newestAt)
                .ExecuteUpdateAsync(s => s.SetProperty(c => c.User1LastReadAt, newestAt), cancellationToken)
            : await conversation
                .Where(c => c.User2LastReadAt == null || c.User2LastReadAt < newestAt)
                .ExecuteUpdateAsync(s => s.SetProperty(c => c.User2LastReadAt, newestAt), cancellationToken);
    }

    private async Task<MessageDetailDto> MapDetailAsync(
        Message m,
        Guid receiverId,
        ApplicationUser sender,
        ApplicationUser receiver,
        CancellationToken cancellationToken)
    {
        var senderProfile = sender.Profile;
        var receiverProfile = receiver.Profile;

        return new MessageDetailDto(
            m.Id,
            m.SenderId,
            receiverId,
            m.Content,
            m.CreatedAt,
            // Only used for a just-sent message, which the receiver can't have read yet.
            false,
            new MessageParticipantDto(
                sender.Id,
                sender.Email ?? string.Empty,
                senderProfile is null
                    ? null
                    : new MessageParticipantProfileDto(
                        senderProfile.FirstName,
                        senderProfile.LastName,
                        await avatarUrls.ResolveAsync(senderProfile.AvatarStorageKey, cancellationToken))),
            new MessageParticipantDto(
                receiver.Id,
                receiver.Email ?? string.Empty,
                receiverProfile is null
                    ? null
                    : new MessageParticipantProfileDto(
                        receiverProfile.FirstName,
                        receiverProfile.LastName,
                        await avatarUrls.ResolveAsync(receiverProfile.AvatarStorageKey, cancellationToken))));
    }

    private async Task<MessageThreadDto> MapThreadAsync(
        Message m,
        Conversation conversation,
        Dictionary<Guid, ApplicationUser> usersBySenderId,
        CancellationToken cancellationToken)
    {
        usersBySenderId.TryGetValue(m.SenderId, out ApplicationUser? sender);
        var p = sender?.Profile;
        MessageSenderPreviewDto? senderDto = new MessageSenderPreviewDto(
            m.SenderId,
            p is null
                ? null
                : new MessageSenderProfilePreviewDto(
                    p.FirstName,
                    p.LastName,
                    await avatarUrls.ResolveAsync(p.AvatarStorageKey, cancellationToken)));

        // Derived from the conversation, not the Message.ReceiverId column, which step 7 removes.
        Guid receiverId = m.SenderId == conversation.User1Id ? conversation.User2Id : conversation.User1Id;

        return new MessageThreadDto(
            m.Id,
            m.SenderId,
            receiverId,
            m.Content,
            m.CreatedAt,
            conversation.IsReadBy(receiverId, m.CreatedAt),
            senderDto);
    }
}
