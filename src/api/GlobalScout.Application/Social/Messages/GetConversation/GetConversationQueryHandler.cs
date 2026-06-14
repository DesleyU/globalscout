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

        await messages.MarkMessagesReadAsync(query.UserId, query.OtherUserId, cancellationToken);

        var normalized = page
            .Select(m =>
                m.SenderId == query.OtherUserId && m.ReceiverId == query.UserId
                    ? m with { IsRead = true }
                    : m)
            .ToList();

        return Result.Success(
            new GetConversationResult(normalized, query.Page, query.Limit, hasMore));
    }
}
