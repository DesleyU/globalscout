using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Abstractions.Persistence;

public sealed record AuditLogEntry(
    Guid? ActorUserId,
    string Action,
    string EntityType,
    string EntityId,
    IReadOnlyDictionary<string, object?>? Details = null);

public interface IAuditLogRepository
{
    Task AddAsync(AuditLogEntry entry, CancellationToken cancellationToken);
}
