using GlobalScout.Application.Abstractions.Files;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Users.GetAvatarReadUrl;

internal sealed class GetAvatarReadUrlQueryHandler(
    IUserDirectoryRepository users,
    IFileStorage fileStorage)
    : IQueryHandler<GetAvatarReadUrlQuery, AvatarReadUrlResult>
{
    public async Task<Result<AvatarReadUrlResult>> Handle(
        GetAvatarReadUrlQuery query,
        CancellationToken cancellationToken)
    {
        var storageKey = await users.GetAvatarStorageKeyAsync(query.OwnerId, cancellationToken);
        if (string.IsNullOrWhiteSpace(storageKey))
        {
            return Result.Failure<AvatarReadUrlResult>(
                Error.NotFound("Users.AvatarNotFound", "Avatar not found."));
        }

        var readUrl = await fileStorage.CreateReadUrlAsync(storageKey, cancellationToken);
        return readUrl.IsFailure
            ? Result.Failure<AvatarReadUrlResult>(readUrl.Error)
            : Result.Success(new AvatarReadUrlResult(readUrl.Value.Url, readUrl.Value.ExpiresAt));
    }
}
