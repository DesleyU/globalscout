using GlobalScout.Application.Abstractions.Media;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Media;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Media.GetUserVideos;

internal sealed class GetUserVideosQueryHandler(IMediaRepository media)
    : IQueryHandler<GetUserVideosQuery, IReadOnlyList<MediaVideoListItemDto>>
{
    public async Task<Result<IReadOnlyList<MediaVideoListItemDto>>> Handle(
        GetUserVideosQuery query,
        CancellationToken cancellationToken)
    {
        var list = await media.ListVideosForUserAsync(query.OwnerUserId, cancellationToken);
        return Result.Success<IReadOnlyList<MediaVideoListItemDto>>(list);
    }
}
