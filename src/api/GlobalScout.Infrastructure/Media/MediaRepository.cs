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

    public Task<int> CountImagesAsync(Guid userId, CancellationToken cancellationToken) =>
        db.MediaItems.AsNoTracking()
            .CountAsync(m => m.UserId == userId && m.Type == MediaType.Image, cancellationToken);

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

    public async Task<IReadOnlyList<MediaVideoListItemDto>> ListImagesForUserAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        List<MediaItem> rows = await db.MediaItems.AsNoTracking()
            .Where(m => m.UserId == userId && m.Type == MediaType.Image)
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync(cancellationToken);

        return rows.Select(Map).ToList();
    }

    public Task<MediaItem?> FindOwnedVideoAsync(Guid userId, Guid videoId, CancellationToken cancellationToken) =>
        db.MediaItems.FirstOrDefaultAsync(
            m => m.Id == videoId && m.UserId == userId && m.Type == MediaType.Video,
            cancellationToken);

    public Task<MediaItem?> FindOwnedImageAsync(Guid userId, Guid photoId, CancellationToken cancellationToken) =>
        db.MediaItems.FirstOrDefaultAsync(
            m => m.Id == photoId && m.UserId == userId && m.Type == MediaType.Image,
            cancellationToken);

    public Task<MediaItem?> FindVideoAsync(Guid videoId, CancellationToken cancellationToken) =>
        db.MediaItems.AsNoTracking().FirstOrDefaultAsync(
            m => m.Id == videoId && m.Type == MediaType.Video,
            cancellationToken);

    public Task<MediaItem?> FindAnyAsync(Guid mediaId, CancellationToken cancellationToken) =>
        db.MediaItems.AsNoTracking().FirstOrDefaultAsync(m => m.Id == mediaId, cancellationToken);

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
            MediaTypeToApi(m.Type),
            m.StorageKey,
            m.Filename,
            m.OriginalName,
            m.MimeType,
            m.Size,
            m.Title,
            m.Description,
            m.Tags,
            m.CreatedAt,
            m.UpdatedAt);

    private static string MediaTypeToApi(MediaType type) => type switch
    {
        MediaType.Video => "VIDEO",
        MediaType.Image => "IMAGE",
        MediaType.Document => "DOCUMENT",
        _ => type.ToString().ToUpperInvariant()
    };
}
