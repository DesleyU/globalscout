using GlobalScout.Domain.Identity;

namespace GlobalScout.Application.Auth.Login;

public sealed record LoginUserResult(
    Guid UserId,
    string Email,
    string Role,
    string Token,
    AccountType AccountType,
    LoginUserProfileDto Profile);

public sealed record LoginUserProfileDto(
    string FirstName,
    string LastName,
    string? Position,
    int? Age,
    string? ClubName);
