using GlobalScout.Application.Abstractions.Files;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Users.GetBannerReadUrl;

internal sealed class GetBannerReadUrlQueryHandler(
    IUserDirectoryRepository users,
    IFileStorage fileStorage)
    : IQueryHandler<GetBannerReadUrlQuery, BannerReadUrlResult>
{
    public async Task<Result<BannerReadUrlResult>> Handle(
        GetBannerReadUrlQuery query,
        CancellationToken cancellationToken)
    {
        var storageKey = await users.GetBannerStorageKeyAsync(query.OwnerId, cancellationToken);
        if (string.IsNullOrWhiteSpace(storageKey))
        {
            return Result.Failure<BannerReadUrlResult>(
                Error.NotFound("Users.BannerNotFound", "Banner not found."));
        }

        var readUrl = await fileStorage.CreateReadUrlAsync(storageKey, cancellationToken);
        return readUrl.IsFailure
            ? Result.Failure<BannerReadUrlResult>(readUrl.Error)
            : Result.Success(new BannerReadUrlResult(readUrl.Value.Url, readUrl.Value.ExpiresAt));
    }
}
