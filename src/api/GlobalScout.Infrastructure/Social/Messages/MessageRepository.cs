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
            ReceiverId = receiverId,
            Content = content,
            IsRead = false,
            CreatedAt = now,
            UpdatedAt = now
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
            .FirstAsync(u => u.Id == loaded.ReceiverId, cancellationToken);

        return await MapDetailAsync(loaded, sender, receiver, cancellationToken);
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

    public async Task<(IReadOnlyList<MessageThreadDto> Messages, bool HasMore)> GetConversationPageAsync(
        Guid userId,
        Guid otherUserId,
        int page,
        int limit,
        CancellationToken cancellationToken)
    {
        int skip = (page - 1) * limit;

        var query = db.Messages.AsNoTracking()
            .Where(m =>
                (m.SenderId == userId && m.ReceiverId == otherUserId)
                || (m.SenderId == otherUserId && m.ReceiverId == userId));

        List<Message> batch = await query
            .OrderByDescending(m => m.CreatedAt)
            .Skip(skip)
            .Take(limit)
            .ToListAsync(cancellationToken);

        bool hasMore = batch.Count == limit;
        batch.Reverse();

        var senderIds = batch.Select(m => m.SenderId).Distinct().ToList();
        var users = await db.Users.AsNoTracking()
            .Include(u => u.Profile)
            .Where(u => senderIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, cancellationToken);

        var messages = new List<MessageThreadDto>(batch.Count);
        foreach (var message in batch)
        {
            messages.Add(await MapThreadAsync(message, users, cancellationToken));
        }

        return (messages, hasMore);
    }

    public async Task<IReadOnlyList<ConversationListItemDto>> GetConversationsAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var latestPerOther = await (
            from m in db.Messages.AsNoTracking()
            where m.SenderId == userId || m.ReceiverId == userId
            group m by m.SenderId == userId ? m.ReceiverId : m.SenderId
            into g
            select g.OrderByDescending(x => x.CreatedAt).First()
        ).ToListAsync(cancellationToken);

        var ordered = latestPerOther.OrderByDescending(m => m.CreatedAt).ToList();
        if (ordered.Count == 0)
        {
            return [];
        }

        var otherIds = ordered
            .Select(m => m.SenderId == userId ? m.ReceiverId : m.SenderId)
            .Distinct()
            .ToList();

        var users = await db.Users.AsNoTracking()
            .Where(u => otherIds.Contains(u.Id))
            .Include(u => u.Profile)
            .ToDictionaryAsync(u => u.Id, cancellationToken);

        var unreadCounts = await db.Messages.AsNoTracking()
            .Where(m => m.ReceiverId == userId && otherIds.Contains(m.SenderId) && !m.IsRead)
            .GroupBy(m => m.SenderId)
            .Select(g => new { OtherId = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var unreadDict = unreadCounts.ToDictionary(x => x.OtherId, x => x.Count);

        var result = new List<ConversationListItemDto>(ordered.Count);
        foreach (Message m in ordered)
        {
            var otherId = m.SenderId == userId ? m.ReceiverId : m.SenderId;
            if (!users.TryGetValue(otherId, out ApplicationUser? otherUser))
            {
                continue;
            }

            var last = new ConversationLastMessageDto(
                m.Id,
                m.Content,
                m.SenderId,
                m.ReceiverId,
                m.CreatedAt,
                m.IsRead);

            var profile = otherUser.Profile;
            var partner = new ConversationPartnerDto(
                otherUser.Id,
                otherUser.Email ?? string.Empty,
                profile is null
                    ? null
                    : new ConversationPartnerProfileDto(
                        profile.FirstName,
                        profile.LastName,
                        await avatarUrls.ResolveAsync(profile.AvatarStorageKey, cancellationToken)));

            result.Add(new ConversationListItemDto(
                otherId,
                last,
                partner,
                unreadDict.GetValueOrDefault(otherId)));
        }

        return result;
    }

    public async Task<int> MarkMessagesReadAsync(
        Guid receiverId,
        Guid senderId,
        CancellationToken cancellationToken)
    {
        var rows = await db.Messages
            .Where(m => m.SenderId == senderId && m.ReceiverId == receiverId && !m.IsRead)
            .ExecuteUpdateAsync(
                s => s.SetProperty(m => m.IsRead, true).SetProperty(m => m.UpdatedAt, DateTimeOffset.UtcNow),
                cancellationToken);
        return rows;
    }

    private async Task<MessageDetailDto> MapDetailAsync(
        Message m,
        ApplicationUser sender,
        ApplicationUser receiver,
        CancellationToken cancellationToken)
    {
        var senderProfile = sender.Profile;
        var receiverProfile = receiver.Profile;

        return new MessageDetailDto(
            m.Id,
            m.SenderId,
            m.ReceiverId,
            m.Content,
            m.CreatedAt,
            m.IsRead,
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

        return new MessageThreadDto(
            m.Id,
            m.SenderId,
            m.ReceiverId,
            m.Content,
            m.CreatedAt,
            m.IsRead,
            senderDto);
    }
}
