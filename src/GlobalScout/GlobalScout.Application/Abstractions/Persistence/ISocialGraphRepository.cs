using GlobalScout.Application.Social;
using GlobalScout.Domain.Identity;
using GlobalScout.Domain.Social;

namespace GlobalScout.Application.Abstractions.Persistence;

public interface ISocialGraphRepository
{
    Task<AccountType?> GetAccountTypeAsync(Guid userId, CancellationToken cancellationToken);

    Task<bool> IsActiveUserAsync(Guid userId, CancellationToken cancellationToken);

    Task<bool> UserExistsAsync(Guid userId, CancellationToken cancellationToken);

    Task<int> CountAcceptedConnectionsAsync(Guid userId, CancellationToken cancellationToken);

    Task<bool> ConnectionExistsAsync(Guid senderId, Guid receiverId, CancellationToken cancellationToken);

    Task<SendConnectionResponseDto?> CreateConnectionAsync(
        Guid senderId,
        Guid receiverId,
        string? invitationNote,
        CancellationToken cancellationToken);

    /// <summary>Accept or reject a pending connection where <paramref name="receiverId"/> is the receiver.</summary>
    Task<RespondToConnectionResponseDto?> RespondToPendingConnectionAsync(
        Guid connectionId,
        Guid receiverId,
        ConnectionStatus newStatus,
        CancellationToken cancellationToken);

    Task<(IReadOnlyList<ConnectionListItemDto> Items, int Total)> GetConnectionsPageAsync(
        Guid userId,
        ConnectionStatus status,
        int page,
        int limit,
        CancellationToken cancellationToken);

    Task<(IReadOnlyList<ConnectionRequestRowDto> Items, int Total)> GetPendingRequestsPageAsync(
        Guid userId,
        bool received,
        int page,
        int limit,
        CancellationToken cancellationToken);

    Task<bool> FollowExistsAsync(Guid followerId, Guid followingId, CancellationToken cancellationToken);

    Task<FollowUserResponseDto?> CreateFollowAsync(Guid followerId, Guid followingId, CancellationToken cancellationToken);

    Task<bool> DeleteFollowAsync(Guid followerId, Guid followingId, CancellationToken cancellationToken);

    Task<(IReadOnlyList<FollowListEntryDto> Items, int Total)> GetFollowersPageAsync(
        Guid userId,
        int page,
        int limit,
        CancellationToken cancellationToken);

    Task<(IReadOnlyList<FollowListEntryDto> Items, int Total)> GetFollowingPageAsync(
        Guid userId,
        int page,
        int limit,
        CancellationToken cancellationToken);

    Task<(bool IsFollowing, Guid? FollowId)> GetFollowStatusAsync(
        Guid followerId,
        Guid followingId,
        CancellationToken cancellationToken);

    Task<(int FollowersCount, int FollowingCount)> GetFollowCountsAsync(Guid userId, CancellationToken cancellationToken);
}
