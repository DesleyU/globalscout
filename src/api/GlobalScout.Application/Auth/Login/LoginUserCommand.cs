using GlobalScout.Application.Abstractions.Messaging;

namespace GlobalScout.Application.Auth.Login;

public sealed record LoginUserCommand(string Email, string Password) : ICommand<LoginUserResult>;
