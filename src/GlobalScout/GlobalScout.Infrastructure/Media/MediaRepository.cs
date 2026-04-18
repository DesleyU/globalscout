using GlobalScout.Application.Abstractions.Media;
using GlobalScout.Application.Media;
using GlobalScout.Domain.Media;
using GlobalScout.Domain.Users;
using GlobalScout.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace GlobalScout.Infrastructure.Media;

internal sealed class MediaRepository(GlobalScoutDbContext db) : IMediaRepository
{
    public Task<int> CountVideosAsync(Guid userId, CancellationToken cancellationToken) =>
        db.MediaItems.AsNoTracking()
            .CountAsync(m => m.UserId == userId && m.Type == MediaType.Video, cancellationToken);

    public async Task<IReadOnlyList<MediaVideoListItemDto>> ListVideosForUserAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        List<MediaItem> rows = await db.MediaItems.AsNoTracking()
            .Where(m => m.UserId == userId && m.Type == MediaType.Video)
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync(cancellationToken);

        return rows.Select(Map).ToList();
    }

    public Task<MediaItem?> FindOwnedVideoAsync(Guid userId, Guid videoId, CancellationToken cancellationToken) =>
        db.MediaItems.FirstOrDefaultAsync(
            m => m.Id == videoId && m.UserId == userId && m.Type == MediaType.Video,
            cancellationToken);

    public async Task AddAsync(MediaItem item, CancellationToken cancellationToken)
    {
        db.MediaItems.Add(item);
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Guid videoId, CancellationToken cancellationToken)
    {
        MediaItem? entity = await db.MediaItems.FirstOrDefaultAsync(m => m.Id == videoId, cancellationToken);
        if (entity is not null)
        {
            db.MediaItems.Remove(entity);
            await db.SaveChangesAsync(cancellationToken);
        }
    }

    private static MediaVideoListItemDto Map(MediaItem m) =>
        new(
            m.Id,
            m.UserId,
            "VIDEO",
            m.Url,
            m.Filename,
            m.OriginalName,
            m.MimeType,
            m.Size,
            m.Title,
            m.Description,
            m.Tags,
            m.CreatedAt,
            m.UpdatedAt);
}
