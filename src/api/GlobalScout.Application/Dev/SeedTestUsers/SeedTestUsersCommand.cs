using GlobalScout.Application.Abstractions.Messaging;

namespace GlobalScout.Application.Dev.SeedTestUsers;

public sealed record SeedTestUsersCommand(string Role, int Count) : ICommand<SeedTestUsersResult>;

public sealed record SeededTestUser(
    Guid Id,
    string Email,
    string Password,
    string Role,
    string FirstName,
    string LastName);

public sealed record SeedTestUsersResult(IReadOnlyList<SeededTestUser> Users);
