using GlobalScout.Application.Abstractions.Files;
using GlobalScout.Application.Abstractions.Media;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Media.GetMediaReadUrl;

internal sealed class GetMediaReadUrlQueryHandler(
    IMediaRepository media,
    ISocialGraphRepository socialGraph,
    IFileStorage fileStorage)
    : IQueryHandler<GetMediaReadUrlQuery, MediaReadUrlResult>
{
    public async Task<Result<MediaReadUrlResult>> Handle(
        GetMediaReadUrlQuery query,
        CancellationToken cancellationToken)
    {
        var item = await media.FindVideoAsync(query.MediaId, cancellationToken);
        if (item is null)
        {
            return Result.Failure<MediaReadUrlResult>(MediaErrors.VideoNotFound);
        }

        if (item.UserId != query.RequesterId)
        {
            var connected = await socialGraph.AcceptedConnectionExistsAsync(
                query.RequesterId,
                item.UserId,
                cancellationToken);

            if (!connected)
            {
                return Result.Failure<MediaReadUrlResult>(MediaErrors.VideoNotFound);
            }
        }

        var readUrl = await fileStorage.CreateReadUrlAsync(item.StorageKey, cancellationToken);
        return readUrl.IsFailure
            ? Result.Failure<MediaReadUrlResult>(readUrl.Error)
            : Result.Success(new MediaReadUrlResult(readUrl.Value.Url, readUrl.Value.ExpiresAt));
    }
}
