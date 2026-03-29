using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Abstractions.RealTime;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Social.Messages.SendMessage;

internal sealed class SendMessageCommandHandler(
    ISocialGraphRepository social,
    IMessageRepository messages,
    IMessageRealtimeNotifier notifier)
    : ICommandHandler<SendMessageCommand, MessageDetailDto>
{
    public async Task<Result<MessageDetailDto>> Handle(
        SendMessageCommand command,
        CancellationToken cancellationToken)
    {
        if (command.SenderId == command.ReceiverId)
        {
            return Result.Failure<MessageDetailDto>(MessagingErrors.CannotMessageSelf);
        }

        if (!await social.IsActiveUserAsync(command.ReceiverId, cancellationToken))
        {
            return Result.Failure<MessageDetailDto>(MessagingErrors.ReceiverNotFound);
        }

        if (!await messages.HasAcceptedConnectionAsync(command.SenderId, command.ReceiverId, cancellationToken))
        {
            return Result.Failure<MessageDetailDto>(MessagingErrors.NotConnected);
        }

        string content = command.Content.Trim();
        if (content.Length == 0)
        {
            return Result.Failure<MessageDetailDto>(
                Error.Validation("Messaging.EmptyContent", "Message content cannot be empty."));
        }

        MessageDetailDto created = await messages.CreateMessageAsync(
            command.SenderId,
            command.ReceiverId,
            content,
            cancellationToken);

        await notifier.NotifyNewMessageAsync(command.ReceiverId, created, cancellationToken);

        return Result.Success(created);
    }
}
