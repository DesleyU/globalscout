using GlobalScout.Application.Abstractions.Messaging;

namespace GlobalScout.Application.Social.Messages.MarkRead;

public sealed class MarkMessagesReadCommand : ICommand<int>
{
    public Guid UserId { get; init; }

    public Guid OtherUserId { get; init; }
}
