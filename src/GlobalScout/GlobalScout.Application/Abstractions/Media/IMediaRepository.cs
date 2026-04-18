using GlobalScout.Application.Media;
using GlobalScout.Domain.Users;

namespace GlobalScout.Application.Abstractions.Media;

public interface IMediaRepository
{
    Task<int> CountVideosAsync(Guid userId, CancellationToken cancellationToken);

    Task<IReadOnlyList<MediaVideoListItemDto>> ListVideosForUserAsync(
        Guid userId,
        CancellationToken cancellationToken);

    Task<MediaItem?> FindOwnedVideoAsync(Guid userId, Guid videoId, CancellationToken cancellationToken);

    Task AddAsync(MediaItem item, CancellationToken cancellationToken);

    Task DeleteAsync(Guid videoId, CancellationToken cancellationToken);
}
