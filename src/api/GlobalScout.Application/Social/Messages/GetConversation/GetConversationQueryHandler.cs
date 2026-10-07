using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Abstractions.Social.Messages;
using GlobalScout.SharedKernel;
using GlobalScout.Application.Social.Messages;

namespace GlobalScout.Application.Social.Messages.GetConversation;

internal sealed class GetConversationQueryHandler(
    ISocialGraphRepository social,
    IMessageRepository messages)
    : IQueryHandler<GetConversationQuery, GetConversationResult>
{
    public async Task<Result<GetConversationResult>> Handle(
        GetConversationQuery query,
        CancellationToken cancellationToken)
    {
        if (!await social.UserExistsAsync(query.OtherUserId, cancellationToken))
        {
            return Result.Failure<GetConversationResult>(MessageErrors.ReceiverNotFound);
        }

        (IReadOnlyList<MessageThreadDto> page, bool hasMore) = await messages.GetConversationPageAsync(
            query.UserId,
            query.OtherUserId,
            query.Page,
            query.Limit,
            cancellationToken);

        return Result.Success(
            new GetConversationResult(page, query.Page, query.Limit, hasMore));
    }
}
