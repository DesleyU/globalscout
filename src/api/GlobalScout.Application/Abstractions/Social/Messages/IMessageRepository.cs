using GlobalScout.Application.Social.Messages;

namespace GlobalScout.Application.Abstractions.Social.Messages;

public interface IMessageRepository
{
    Task<bool> HasAcceptedConnectionAsync(Guid userId, Guid otherUserId, CancellationToken cancellationToken);

    Task<MessageDetailDto> CreateMessageAsync(
        Guid senderId,
        Guid receiverId,
        string content,
        CancellationToken cancellationToken);

    Task<(IReadOnlyList<MessageThreadDto> Messages, bool HasMore)> GetConversationPageAsync(
        Guid userId,
        Guid otherUserId,
        int page,
        int limit,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<ConversationListItemDto>> GetConversationsAsync(
        Guid userId,
        CancellationToken cancellationToken);

    Task<int> MarkMessagesReadAsync(Guid receiverId, Guid senderId, CancellationToken cancellationToken);
}
