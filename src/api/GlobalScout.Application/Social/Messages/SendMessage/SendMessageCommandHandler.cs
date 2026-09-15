using GlobalScout.Application.Abstractions.Auth;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Abstractions.Social.Messages;
using GlobalScout.Application.Auth;
using GlobalScout.Application.Social.Messages;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Social.Messages.SendMessage;

internal sealed class SendMessageCommandHandler(
    ISocialGraphRepository social,
    IMessageRepository messages,
    IMessageRealtimeNotifier notifier,
    IUserIdentityStore identityStore)
    : ICommandHandler<SendMessageCommand, MessageDetailDto>
{
    public async Task<Result<MessageDetailDto>> Handle(
        SendMessageCommand command,
        CancellationToken cancellationToken)
    {
        if (command.SenderId == command.ReceiverId)
        {
            return Result.Failure<MessageDetailDto>(MessageErrors.CannotMessageSelf);
        }

        if (!await identityStore.IsEmailConfirmedAsync(command.SenderId, cancellationToken))
        {
            return Result.Failure<MessageDetailDto>(AuthErrors.EmailNotVerified);
        }

        if (!await social.IsActiveUserAsync(command.ReceiverId, cancellationToken))
        {
            return Result.Failure<MessageDetailDto>(MessageErrors.ReceiverNotFound);
        }

        if (!await messages.HasAcceptedConnectionAsync(command.SenderId, command.ReceiverId, cancellationToken))
        {
            return Result.Failure<MessageDetailDto>(MessageErrors.NotConnected);
        }

        string content = command.Content.Trim();
        if (content.Length == 0)
        {
            return Result.Failure<MessageDetailDto>(
                Error.Validation("Messages.EmptyContent", "Message content cannot be empty."));
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
