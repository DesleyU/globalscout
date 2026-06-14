using GlobalScout.Application.Auth.GetProfile;

namespace GlobalScout.Application.Account.SetRole;

public sealed record SetUserRoleResult(
    Guid UserId,
    string Email,
    string Role,
    string Token,
    AuthProfilePayload Profile);

public sealed record SetUserRoleOutcome(
    Guid UserId,
    string Email,
    string NewRole,
    AuthProfilePayload Profile);
