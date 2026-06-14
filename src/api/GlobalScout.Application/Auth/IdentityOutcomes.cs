using GlobalScout.Domain.Identity;

namespace GlobalScout.Application.Auth;

public sealed record RegisterUserOutcome(
    Guid UserId,
    string Email,
    string Role,
    RegistrationProfileDto Profile);

public sealed record RegistrationProfileDto(
    string FirstName,
    string LastName,
    string? Position,
    int? Age,
    string? ClubName);

public sealed record LoginUserOutcome(
    Guid UserId,
    string Email,
    string Role,
    UserRole DomainRole,
    AccountType AccountType,
    LoginProfileDto Profile);

public sealed record LoginProfileDto(
    string FirstName,
    string LastName,
    string? Position,
    int? Age,
    string? ClubName);
