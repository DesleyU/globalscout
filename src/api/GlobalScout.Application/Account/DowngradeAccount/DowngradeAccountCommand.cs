using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Domain.Identity;

namespace GlobalScout.Application.Account.DowngradeAccount;

public sealed record DowngradeAccountCommand(Guid UserId) : ICommand<AccountType>;
