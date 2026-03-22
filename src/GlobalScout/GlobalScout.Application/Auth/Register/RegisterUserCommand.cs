using GlobalScout.Application.Abstractions.Messaging;

namespace GlobalScout.Application.Auth.Register;

public sealed record RegisterUserCommand(
    string Email,
    string Password,
    string Role,
    string FirstName,
    string LastName,
    string? Position,
    int? Age,
    string? ClubName) : ICommand<RegisterUserResult>;
