using GlobalScout.Application.Abstractions.Messaging;

namespace GlobalScout.Application.Social.Messages.SendMessage;

public sealed class SendMessageCommand : ICommand<MessageDetailDto>
{
    public Guid SenderId { get; init; }

    public Guid ReceiverId { get; init; }

    public string Content { get; init; } = string.Empty;
}
