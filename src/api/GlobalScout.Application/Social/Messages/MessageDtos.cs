using System.Text.Json.Serialization;

namespace GlobalScout.Application.Social.Messages;

public sealed record MessageParticipantProfileDto(
    string FirstName,
    string LastName,
    string? Avatar);

public sealed record MessageParticipantDto(
    Guid Id,
    string Email,
    MessageParticipantProfileDto? Profile);

public sealed record MessageDetailDto(
    Guid Id,
    Guid SenderId,
    Guid ReceiverId,
    string Content,
    DateTimeOffset CreatedAt,
    bool IsRead,
    MessageParticipantDto Sender,
    MessageParticipantDto Receiver);

public sealed record MessageSenderPreviewDto(
    Guid Id,
    MessageSenderProfilePreviewDto? Profile);

public sealed record MessageSenderProfilePreviewDto(
    string FirstName,
    string LastName,
    string? Avatar);

public sealed record MessageThreadDto(
    Guid Id,
    Guid SenderId,
    Guid ReceiverId,
    string Content,
    DateTimeOffset CreatedAt,
    bool IsRead,
    MessageSenderPreviewDto? Sender);

public sealed record ConversationLastMessageDto(
    Guid Id,
    string Content,
    Guid SenderId,
    Guid ReceiverId,
    DateTimeOffset CreatedAt,
    bool IsRead);

public sealed record ConversationPartnerProfileDto(
    string FirstName,
    string LastName,
    [property: JsonPropertyName("profilePicture")] string? ProfilePicture);

public sealed record ConversationPartnerDto(
    Guid Id,
    string Email,
    ConversationPartnerProfileDto? Profile);

public sealed record ConversationListItemDto(
    Guid Id,
    ConversationLastMessageDto LastMessage,
    ConversationPartnerDto OtherUser,
    int UnreadCount);

public sealed record GetConversationResult(
    IReadOnlyList<MessageThreadDto> Messages,
    int Page,
    int Limit,
    bool HasMore);

public sealed record GetConversationsResult(IReadOnlyList<ConversationListItemDto> Conversations);
