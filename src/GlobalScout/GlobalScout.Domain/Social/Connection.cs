namespace GlobalScout.Domain.Social;

public sealed class Connection
{
    public Guid Id { get; set; }

    public Guid SenderId { get; set; }

    public Guid ReceiverId { get; set; }

    public ConnectionStatus Status { get; set; } = ConnectionStatus.Pending;

    public string? InvitationNote { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }
}
