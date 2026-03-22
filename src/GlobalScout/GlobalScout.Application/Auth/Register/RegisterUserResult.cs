namespace GlobalScout.Application.Auth.Register;

public sealed record RegisterUserResult(
    Guid UserId,
    string Email,
    string Role,
    string Token,
    RegisterUserProfileDto Profile);

public sealed record RegisterUserProfileDto(
    string FirstName,
    string LastName,
    string? Position,
    int? Age,
    string? ClubName);
