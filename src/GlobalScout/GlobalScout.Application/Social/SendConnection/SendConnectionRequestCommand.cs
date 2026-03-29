using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Social;

namespace GlobalScout.Application.Social.SendConnection;

public sealed class SendConnectionRequestCommand : ICommand<SendConnectionResponseDto>
{
    public Guid SenderId { get; init; }

    public Guid ReceiverId { get; init; }

    public string? Message { get; init; }
}
