using GlobalScout.Application.Abstractions.Messaging;

namespace GlobalScout.Application.Auth.VerifyEmail;

public sealed record VerifyEmailCommand(string Token) : ICommand<VerifyEmailResult>;
