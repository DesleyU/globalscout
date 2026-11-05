using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Abstractions.Social.Messages;
using GlobalScout.SharedKernel;
using GlobalScout.Application.Social.Messages;
using GlobalScout.Domain.Social;

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

        MessageCursor? before = null;
        if (query.Before is not null)
        {
            if (!MessageCursor.TryParse(query.Before, out var cursor))
            {
                return Result.Failure<GetConversationResult>(MessageErrors.InvalidCursor);
            }

            before = cursor;
        }

        (IReadOnlyList<MessageThreadDto> page, string? nextCursor, bool hasMore) = await messages.GetConversationPageAsync(
            query.UserId,
            query.OtherUserId,
            before,
            query.Limit,
            cancellationToken);

        return Result.Success(new GetConversationResult(page, nextCursor, hasMore));
    }
}
