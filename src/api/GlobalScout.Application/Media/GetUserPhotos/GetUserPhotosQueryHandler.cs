using GlobalScout.Application.Abstractions.Media;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Media;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Media.GetUserPhotos;

internal sealed class GetUserPhotosQueryHandler(IMediaRepository media)
    : IQueryHandler<GetUserPhotosQuery, IReadOnlyList<MediaVideoListItemDto>>
{
    public async Task<Result<IReadOnlyList<MediaVideoListItemDto>>> Handle(
        GetUserPhotosQuery query,
        CancellationToken cancellationToken)
    {
        var list = await media.ListImagesForUserAsync(query.OwnerUserId, cancellationToken);
        return Result.Success<IReadOnlyList<MediaVideoListItemDto>>(list);
    }
}
