using GlobalScout.Application.Abstractions.Files;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Social;
using GlobalScout.Application.Users;
using GlobalScout.Domain.Identity;
using GlobalScout.Domain.Social;
using GlobalScout.Domain.Users;
using GlobalScout.Infrastructure.Data;
using GlobalScout.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace GlobalScout.Infrastructure.Social.Notifications;

internal sealed class NotificationRepository(
    GlobalScoutDbContext db,
    UserManager<ApplicationUser> userManager,
    IAvatarUrlResolver avatarUrls) : INotificationRepository
{
    public async Task<NotificationDto> CreateAsync(
        NotificationType type,
        Guid recipientUserId,
        Guid actorUserId,
        Guid? relatedEntityId,
        CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;

        var existingUnread = await db.Notifications.FirstOrDefaultAsync(
            n => n.RecipientUserId == recipientUserId
                 && n.Type == type
                 && n.ActorUserId == actorUserId
                 && !n.IsRead,
            cancellationToken);

        Notification entity;
        if (existingUnread is not null)
        {
            existingUnread.RelatedEntityId = relatedEntityId;
            existingUnread.CreatedAt = now;
            entity = existingUnread;
        }
        else
        {
            entity = new Notification
            {
                Id = Guid.NewGuid(),
                RecipientUserId = recipientUserId,
                Type = type,
                ActorUserId = actorUserId,
                RelatedEntityId = relatedEntityId,
                IsRead = false,
                CreatedAt = now
            };
            db.Notifications.Add(entity);
        }

        await db.SaveChangesAsync(cancellationToken);

        var actor = await db.Users.AsNoTracking()
            .Include(u => u.Profile)
            .FirstAsync(u => u.Id == actorUserId, cancellationToken);

        return await MapAsync(entity, actor, cancellationToken);
    }

    public async Task<(IReadOnlyList<NotificationDto> Items, int Total, int UnreadCount)> GetPageAsync(
        Guid recipientUserId,
        int page,
        int limit,
        CancellationToken cancellationToken)
    {
        var query = db.Notifications.AsNoTracking()
            .Where(n => n.RecipientUserId == recipientUserId);

        var total = await query.CountAsync(cancellationToken);
        var unreadCount = await query.CountAsync(n => !n.IsRead, cancellationToken);

        var skip = (page - 1) * limit;
        var rows = await query
            .OrderByDescending(n => n.CreatedAt)
            .Skip(skip)
            .Take(limit)
            .ToListAsync(cancellationToken);

        var actorIds = rows.Select(n => n.ActorUserId).Distinct().ToList();
        var actors = actorIds.Count == 0
            ? new Dictionary<Guid, ApplicationUser>()
            : await db.Users.AsNoTracking()
                .Include(u => u.Profile)
                .Where(u => actorIds.Contains(u.Id))
                .ToDictionaryAsync(u => u.Id, cancellationToken);

        var items = new List<NotificationDto>(rows.Count);
        foreach (var n in rows)
        {
            if (!actors.TryGetValue(n.ActorUserId, out ApplicationUser? actor))
            {
                continue;
            }

            items.Add(await MapAsync(n, actor, cancellationToken));
        }

        return (items, total, unreadCount);
    }

    public async Task<(bool Found, int UnreadCount)> MarkReadAsync(
        Guid notificationId,
        Guid recipientUserId,
        CancellationToken cancellationToken)
    {
        var entity = await db.Notifications.FirstOrDefaultAsync(
            n => n.Id == notificationId && n.RecipientUserId == recipientUserId,
            cancellationToken);

        if (entity is null)
        {
            return (false, 0);
        }

        entity.IsRead = true;
        entity.ReadAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);

        var unreadCount = await db.Notifications.AsNoTracking()
            .CountAsync(n => n.RecipientUserId == recipientUserId && !n.IsRead, cancellationToken);

        return (true, unreadCount);
    }

    public async Task<(int MarkedCount, int UnreadCount)> MarkAllReadAsync(
        Guid recipientUserId,
        CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var marked = await db.Notifications
            .Where(n => n.RecipientUserId == recipientUserId && !n.IsRead)
            .ExecuteUpdateAsync(
                s => s.SetProperty(n => n.IsRead, true).SetProperty(n => n.ReadAt, now),
                cancellationToken);

        return (marked, 0);
    }

    private async Task<NotificationDto> MapAsync(
        Notification n,
        ApplicationUser actor,
        CancellationToken cancellationToken)
    {
        var role = await GetRoleNameAsync(actor.Id, cancellationToken);
        return new NotificationDto(
            n.Id,
            n.Type.ToString(),
            new NotificationActorDto(actor.Id, role, await MapProfileAsync(actor.Profile, cancellationToken)),
            n.RelatedEntityId,
            n.IsRead,
            n.CreatedAt);
    }

    private async Task<string> GetRoleNameAsync(Guid userId, CancellationToken cancellationToken)
    {
        var userEntity = await userManager.FindByIdAsync(userId.ToString());
        if (userEntity is null)
        {
            return AppRoleNames.Player;
        }

        var roles = await userManager.GetRolesAsync(userEntity);
        return roles.FirstOrDefault() ?? AppRoleNames.Player;
    }

    private async Task<UserProfileApiDto?> MapProfileAsync(Profile? p, CancellationToken cancellationToken)
    {
        if (p is null)
        {
            return null;
        }

        return new UserProfileApiDto(
            p.UserId,
            p.FirstName,
            p.LastName,
            await avatarUrls.ResolveAsync(p.AvatarStorageKey, cancellationToken),
            p.Bio,
            PositionToApi(p.Position),
            p.Age,
            p.Height,
            p.Weight,
            p.Nationality,
            p.ClubName,
            p.ClubLogo,
            p.Phone,
            p.Website,
            p.Instagram,
            p.Twitter,
            p.Linkedin,
            p.Country,
            p.City,
            p.CreatedAt,
            p.UpdatedAt);
    }

    private static string? PositionToApi(Position? position) =>
        position switch
        {
            null => null,
            Position.Goalkeeper => "GOALKEEPER",
            Position.Defender => "DEFENDER",
            Position.Midfielder => "MIDFIELDER",
            Position.Forward => "FORWARD",
            _ => null
        };
}
