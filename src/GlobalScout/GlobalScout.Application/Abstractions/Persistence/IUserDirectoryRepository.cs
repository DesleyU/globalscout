using System.Text.Json;
using GlobalScout.Application.Users;
using GlobalScout.Domain.Identity;

namespace GlobalScout.Application.Abstractions.Persistence;

public sealed record SearchUsersCriteria(
    Guid ExcludeUserId,
    string? Role,
    string? Position,
    string? Club,
    string? Country,
    string? City,
    int? MinAge,
    int? MaxAge,
    string? Search,
    int Page,
    int Limit);

public interface IUserDirectoryRepository
{
    Task<UsersFullProfileResult?> GetFullProfileAsync(Guid userId, CancellationToken cancellationToken);

    Task UpdateProfileFieldsAsync(Guid userId, ProfileFieldPatch patch, CancellationToken cancellationToken);

    Task SetPlayerIdAsync(Guid userId, int? playerId, CancellationToken cancellationToken);

    Task<bool> PlayerIdExistsForAnotherUserAsync(int playerId, Guid exceptUserId, CancellationToken cancellationToken);

    Task<SearchUsersResult> SearchUsersAsync(SearchUsersCriteria criteria, CancellationToken cancellationToken);

    Task<IReadOnlyList<SearchUserItem>> GetRecommendationsAsync(
        Guid currentUserId,
        UserRole currentRole,
        int limit,
        CancellationToken cancellationToken);

    Task UpsertProfileVisitAsync(Guid profileOwnerId, Guid visitorId, UserRole visitorRole, CancellationToken cancellationToken);

    Task<PublicUserProfileResult?> GetActivePublicUserAsync(Guid userId, CancellationToken cancellationToken);

    Task<GetProfileVisitorsResult> GetProfileVisitorsAsync(Guid profileOwnerId, bool premiumDetails, CancellationToken cancellationToken);

    Task SetAvatarAsync(Guid userId, string avatarUrl, CancellationToken cancellationToken);
}

/// <summary>Non-null properties are applied to the profile row.</summary>
public sealed class ProfileFieldPatch
{
    public string? FirstName { get; init; }

    public string? LastName { get; init; }

    public string? Bio { get; init; }

    public string? Position { get; init; }

    public int? Age { get; init; }

    public int? Height { get; init; }

    public int? Weight { get; init; }

    public string? Nationality { get; init; }

    public string? ClubName { get; init; }

    public string? ClubLogo { get; init; }

    public string? Phone { get; init; }

    public string? Website { get; init; }

    public string? Instagram { get; init; }

    public string? Twitter { get; init; }

    public string? Linkedin { get; init; }

    public string? Country { get; init; }

    public string? City { get; init; }

    public JsonDocument? StatsData { get; init; }

    public bool HasAny =>
        FirstName is not null
        || LastName is not null
        || Bio is not null
        || Position is not null
        || Age is not null
        || Height is not null
        || Weight is not null
        || Nationality is not null
        || ClubName is not null
        || ClubLogo is not null
        || Phone is not null
        || Website is not null
        || Instagram is not null
        || Twitter is not null
        || Linkedin is not null
        || Country is not null
        || City is not null
        || StatsData is not null;
}
