using GlobalScout.Infrastructure.Identity;

namespace GlobalScout.Infrastructure.Data.Entities;

public sealed class Message
{
    public Guid Id { get; set; }

    public Guid SenderId { get; set; }

    public ApplicationUser Sender { get; set; } = null!;

    public Guid ReceiverId { get; set; }

    public ApplicationUser Receiver { get; set; } = null!;

    public string Content { get; set; } = string.Empty;

    public bool IsRead { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }
}
