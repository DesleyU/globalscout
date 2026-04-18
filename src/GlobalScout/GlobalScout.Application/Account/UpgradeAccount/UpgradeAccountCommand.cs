using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Domain.Identity;

namespace GlobalScout.Application.Account.UpgradeAccount;

public sealed record UpgradeAccountCommand(Guid UserId) : ICommand<AccountType>;
