using GlobalScout.Application.Abstractions.Messaging;

namespace GlobalScout.Application.Social.Messages.GetConversations;

public sealed record GetConversationsQuery(Guid UserId) : IQuery<GetConversationsResult>;
