using GlobalScout.Domain.Social;
using GlobalScout.Infrastructure.Identity;

namespace GlobalScout.Infrastructure.Data.Entities;

public sealed class Connection
{
    public Guid Id { get; set; }

    public Guid SenderId { get; set; }

    public ApplicationUser Sender { get; set; } = null!;

    public Guid ReceiverId { get; set; }

    public ApplicationUser Receiver { get; set; } = null!;

    public ConnectionStatus Status { get; set; } = ConnectionStatus.Pending;

    public string? InvitationNote { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }
}
