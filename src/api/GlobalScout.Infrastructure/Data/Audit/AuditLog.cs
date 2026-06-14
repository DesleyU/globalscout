using System.Text.Json;
using GlobalScout.Infrastructure.Identity;

namespace GlobalScout.Infrastructure.Data;

public sealed class AuditLog
{
    public Guid Id { get; set; }

    public Guid? UserId { get; set; }

    public ApplicationUser? User { get; set; }

    public string Action { get; set; } = string.Empty;

    public string? EntityType { get; set; }

    public string? EntityId { get; set; }

    public JsonDocument? Details { get; set; }

    public string? IpAddress { get; set; }

    public string? UserAgent { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
}
