using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Social.Messages;
using GlobalScout.SharedKernel;
using GlobalScout.Application.Social.Messages;

namespace GlobalScout.Application.Social.Messages.GetConversations;

internal sealed class GetConversationsQueryHandler(IMessageRepository messages)
    : IQueryHandler<GetConversationsQuery, GetConversationsResult>
{
    public async Task<Result<GetConversationsResult>> Handle(
        GetConversationsQuery query,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<ConversationListItemDto> list =
            await messages.GetConversationsAsync(query.UserId, cancellationToken);
        return Result.Success(new GetConversationsResult(list));
    }
}
