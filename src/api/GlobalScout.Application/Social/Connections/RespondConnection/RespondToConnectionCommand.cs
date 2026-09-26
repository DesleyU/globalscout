using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Social;

namespace GlobalScout.Application.Social.Connections.RespondConnection;

public sealed class RespondToConnectionCommand : ICommand<RespondToConnectionResponseDto>
{
    public Guid ReceiverId { get; init; }

    public Guid ConnectionId { get; init; }

    /// <summary>accept or reject (legacy lowercase).</summary>
    public string Action { get; init; } = string.Empty;

    /// <summary>Optional note attached to the accept/reject decision.</summary>
    public string? Message { get; init; }
}
