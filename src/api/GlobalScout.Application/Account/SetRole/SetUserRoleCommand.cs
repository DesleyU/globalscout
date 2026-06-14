using GlobalScout.Application.Abstractions.Messaging;

namespace GlobalScout.Application.Account.SetRole;

public sealed record SetUserRoleCommand(Guid UserId, string NewRole) : ICommand<SetUserRoleResult>;
