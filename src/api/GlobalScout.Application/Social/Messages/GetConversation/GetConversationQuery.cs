using GlobalScout.Application.Abstractions.Messaging;

namespace GlobalScout.Application.Social.Messages.GetConversation;

public sealed record GetConversationQuery(
    Guid UserId,
    Guid OtherUserId,
    string? Before,
    int Limit) : IQuery<GetConversationResult>;
