using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Abstractions.Persistence;

namespace GlobalScout.Application.Admin.ListUsers;

public sealed record ListAdminUsersQuery(
    string? Status,
    string? Role,
    string? Search,
    int Page,
    int Limit) : IQuery<AdminUsersListResult>;
