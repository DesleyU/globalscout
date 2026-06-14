using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Application.Users;
using GlobalScout.Domain.Identity;
using GlobalScout.Domain.PlayerIdentity;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.PlayerIdentity;

internal static class PlayerIdentityAccess
{
    public static async Task<Result> EnsurePlayerAsync(
        IUserDirectoryRepository users,
        Guid userId,
        CancellationToken cancellationToken)
    {
        var context = await users.GetMediaUploadContextAsync(userId, cancellationToken);
        if (context is null)
        {
            return Result.Failure(UsersErrors.UserNotFound);
        }

        if (context.Role != UserRole.Player)
        {
            return Result.Failure(PlayerIdentityErrors.OnlyPlayers);
        }

        return Result.Success();
    }
}

internal static class ClaimStatusRules
{
    public static bool BlocksNewClaim(ClaimStatus status) =>
        status is ClaimStatus.Claimed or ClaimStatus.PendingVerification or ClaimStatus.Verified;

    public static bool CanAddEvidence(ClaimStatus status) =>
        status is ClaimStatus.Claimed or ClaimStatus.PendingVerification;

    public static bool CanReview(ClaimStatus status) =>
        status is ClaimStatus.PendingVerification;
}
