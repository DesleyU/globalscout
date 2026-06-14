using System.Text.Json;

namespace GlobalScout.Domain.Users;

public sealed class PlayerStatistics
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string Season { get; set; } = string.Empty;

    /// <summary>e.g. <c>manual</c>, <c>api-football</c></summary>
    public string Source { get; set; } = "manual";

    /// <summary>Contract version for <see cref="Data"/> payload shape.</summary>
    public string SchemaVersion { get; set; } = "1";

    /// <summary>All metrics and provider-specific payload (single source of truth).</summary>
    public JsonDocument? Data { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }
}
