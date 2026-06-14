using GlobalScout.Domain.Identity;

namespace GlobalScout.Application.Auth.GetProfile;

public sealed record GetAuthProfileResult(
    Guid Id,
    string Email,
    string Role,
    UserStatus Status,
    AccountType AccountType,
    AuthProfilePayload Profile);

public sealed record AuthProfilePayload(
    string FirstName,
    string LastName,
    string? Position,
    int? Age,
    string? ClubName);
