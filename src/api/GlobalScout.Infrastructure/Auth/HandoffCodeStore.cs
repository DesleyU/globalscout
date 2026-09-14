using System.Collections.Concurrent;
using System.Security.Cryptography;
using GlobalScout.Application.Abstractions.Auth;

namespace GlobalScout.Infrastructure.Auth;

/// <summary>
/// In-memory single-use handoff code store. Safe on the current single-EC2-host/single-API-container
/// production topology (see docs/AWS-infrastructure_setup_documentation.md); would need a distributed
/// store (e.g. Redis) if the API ever scales to multiple instances.
/// </summary>
internal sealed class HandoffCodeStore : IHandoffCodeStore
{
    private sealed record Entry(Guid UserId, DateTimeOffset ExpiresAt);

    private readonly ConcurrentDictionary<string, Entry> _codes = new(StringComparer.Ordinal);

    public string Issue(Guid userId, TimeSpan ttl)
    {
        var code = GenerateCode();
        _codes[code] = new Entry(userId, DateTimeOffset.UtcNow.Add(ttl));
        return code;
    }

    public bool TryConsume(string code, out Guid userId)
    {
        userId = default;

        if (string.IsNullOrEmpty(code) || !_codes.TryRemove(code, out var entry))
        {
            return false;
        }

        if (entry.ExpiresAt < DateTimeOffset.UtcNow)
        {
            return false;
        }

        userId = entry.UserId;
        return true;
    }

    private static string GenerateCode() =>
        Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
}
