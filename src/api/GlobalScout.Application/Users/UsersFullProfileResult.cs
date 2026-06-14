namespace GlobalScout.Application.Users;

public sealed record UsersFullProfileResult(
    Guid Id,
    string Email,
    string Role,
    string Status,
    string AccountType,
    int? PlayerId,
    UserProfileApiDto? Profile,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
