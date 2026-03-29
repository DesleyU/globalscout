using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Social;

namespace GlobalScout.Application.Social.RespondConnection;

public sealed class RespondToConnectionCommand : ICommand<RespondToConnectionResponseDto>
{
    public Guid ReceiverId { get; init; }

    public Guid ConnectionId { get; init; }

    /// <summary>accept or reject (legacy lowercase).</summary>
    public string Action { get; init; } = string.Empty;
}
