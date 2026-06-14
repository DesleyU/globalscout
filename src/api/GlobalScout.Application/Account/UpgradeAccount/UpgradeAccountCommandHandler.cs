using GlobalScout.Application.Abstractions.Auth;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Domain.Identity;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Account.UpgradeAccount;

internal sealed class UpgradeAccountCommandHandler(IUserIdentityStore identityStore)
    : ICommandHandler<UpgradeAccountCommand, AccountType>
{
    public Task<Result<AccountType>> Handle(UpgradeAccountCommand command, CancellationToken cancellationToken) =>
        identityStore.SetAccountTierAsync(command.UserId, AccountType.Premium, cancellationToken);
}
