using System.Text.Json;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace GlobalScout.Infrastructure.Data.Audit;

internal sealed class AuditLogRepository(GlobalScoutDbContext db) : IAuditLogRepository
{
    public async Task AddAsync(AuditLogEntry entry, CancellationToken cancellationToken)
    {
        var entity = new AuditLog
        {
            Id = Guid.NewGuid(),
            UserId = entry.ActorUserId,
            Action = entry.Action,
            EntityType = entry.EntityType,
            EntityId = entry.EntityId,
            Details = entry.Details is null
                ? null
                : JsonSerializer.SerializeToDocument(entry.Details),
            CreatedAt = DateTimeOffset.UtcNow
        };

        db.AuditLogs.Add(entity);
        await db.SaveChangesAsync(cancellationToken);
    }
}
