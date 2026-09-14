using GlobalScout.Application.Abstractions.Messaging;

namespace GlobalScout.Application.Auth.ExternalLogin;

/// <summary>
/// Exchanged server-to-server by the Next.js BFF for the JWT + user shape, mirroring
/// <c>PostAuthLogin</c>/<c>PostAuthRegister</c>. See contracts/api-auth-external.md.
/// </summary>
public sealed record ExchangeHandoffCodeCommand(string Code) : ICommand<ExchangeHandoffCodeResult>;

public sealed record ExchangeHandoffCodeResult(
    Guid UserId,
    string Email,
    string Role,
    string Token,
    ExchangeHandoffCodeProfileDto Profile);

public sealed record ExchangeHandoffCodeProfileDto(
    string FirstName,
    string LastName,
    string? Position,
    int? Age,
    string? ClubName);
