using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Social.Messages;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Social.Messages.MarkRead;

internal sealed class MarkMessagesReadCommandHandler(IMessageRepository messages)
    : ICommandHandler<MarkMessagesReadCommand, int>
{
    public async Task<Result<int>> Handle(
        MarkMessagesReadCommand command,
        CancellationToken cancellationToken)
    {
        int updated = await messages.MarkMessagesReadAsync(
            command.UserId,
            command.OtherUserId,
            cancellationToken);
        return Result.Success(updated);
    }
}
