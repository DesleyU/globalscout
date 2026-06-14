using GlobalScout.Application.Users;

namespace GlobalScout.Application.Social;

public sealed record ConnectionUserSummaryDto(Guid Id, string Role, UserProfileApiDto? Profile);

public sealed record SendConnectionResponseDto(
    Guid Id,
    string Status,
    string? Message,
    DateTimeOffset CreatedAt,
    ConnectionUserSummaryDto Sender,
    ConnectionUserSummaryDto Receiver);

public sealed record RespondToConnectionResponseDto(
    Guid Id,
    string Status,
    string? Message,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    ConnectionUserSummaryDto Sender,
    ConnectionUserSummaryDto Receiver);

public sealed record ConnectionListItemDto(
    Guid Id,
    string Status,
    string? Message,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    ConnectionUserSummaryDto User);

public sealed record ConnectionRequestRowDto(
    Guid Id,
    string Status,
    string? Message,
    DateTimeOffset CreatedAt,
    ConnectionUserSummaryDto Sender,
    ConnectionUserSummaryDto Receiver);

public sealed record LegacyPaginationDto(int Page, int Limit, int Total, int Pages);

public sealed record GetConnectionsResult(
    IReadOnlyList<ConnectionListItemDto> Connections,
    LegacyPaginationDto Pagination);

public sealed record GetPendingConnectionRequestsResult(
    IReadOnlyList<ConnectionRequestRowDto> Requests,
    LegacyPaginationDto Pagination);

public sealed record FollowingUserDto(Guid Id, string Role, UserProfileApiDto? Profile);

public sealed record FollowUserResponseDto(
    Guid Id,
    FollowingUserDto FollowingUser,
    DateTimeOffset CreatedAt);

public sealed record FollowListEntryDto(
    Guid Id,
    ConnectionUserSummaryDto User,
    DateTimeOffset FollowedAt);

public sealed record GetFollowListResult(
    IReadOnlyList<FollowListEntryDto> Items,
    LegacyPaginationDto Pagination);

public sealed record GetFollowStatusResult(bool IsFollowing, Guid? FollowId);

public sealed record GetFollowStatsResult(int FollowersCount, int FollowingCount);
