namespace GlobalScout.Domain.Social;

public sealed class UserBlock
{
    public Guid BlockerId { get; set; }

    public Guid BlockedId { get; set; }
}
