using GlobalScout.Application.Abstractions.Messaging;

namespace GlobalScout.Application.Auth.Register;

public sealed record RegisterUserCommand(
    string Email,
    string Password,
    string FirstName,
    string LastName) : ICommand<RegisterUserResult>;
