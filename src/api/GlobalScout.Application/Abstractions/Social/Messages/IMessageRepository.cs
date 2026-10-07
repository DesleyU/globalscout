using GlobalScout.Application.Social.Messages;

namespace GlobalScout.Application.Abstractions.Social.Messages;

public interface IMessageRepository
{
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

    /// <summary>Advances <paramref name="userId"/>'s read position in their conversation with <paramref name="otherUserId"/>.</summary>
    Task<int> MarkMessagesReadAsync(Guid userId, Guid otherUserId, CancellationToken cancellationToken);
}
