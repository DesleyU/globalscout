using GlobalScout.Application.Abstractions.Messaging;

namespace GlobalScout.Application.Auth.ResendVerificationEmail;

public sealed record ResendVerificationEmailCommand(Guid UserId) : ICommand<ResendVerificationEmailResult>;
