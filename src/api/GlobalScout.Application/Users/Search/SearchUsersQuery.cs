using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Users;

namespace GlobalScout.Application.Users.Search;

public sealed record SearchUsersQuery(
    Guid CurrentUserId,
    string? Role,
    string? Position,
    string? Club,
    string? Country,
    string? City,
    int? MinAge,
    int? MaxAge,
    string? Search,
    int Page,
    int Limit) : IQuery<SearchUsersResult>;
