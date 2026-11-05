using GlobalScout.Application.Media;
using GlobalScout.Domain.Users;

namespace GlobalScout.Application.Abstractions.Media;

public interface IMediaRepository
{
    Task<int> CountVideosAsync(Guid userId, CancellationToken cancellationToken);

    Task<int> CountImagesAsync(Guid userId, CancellationToken cancellationToken);

    Task<IReadOnlyList<MediaVideoListItemDto>> ListVideosForUserAsync(
        Guid userId,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<MediaVideoListItemDto>> ListImagesForUserAsync(
        Guid userId,
        CancellationToken cancellationToken);

    Task<MediaItem?> FindOwnedVideoAsync(Guid userId, Guid videoId, CancellationToken cancellationToken);

    Task<MediaItem?> FindOwnedImageAsync(Guid userId, Guid photoId, CancellationToken cancellationToken);

    Task<MediaItem?> FindVideoAsync(Guid videoId, CancellationToken cancellationToken);

    Task<MediaItem?> FindAnyAsync(Guid mediaId, CancellationToken cancellationToken);

    Task AddAsync(MediaItem item, CancellationToken cancellationToken);

    Task DeleteAsync(Guid videoId, CancellationToken cancellationToken);
}
