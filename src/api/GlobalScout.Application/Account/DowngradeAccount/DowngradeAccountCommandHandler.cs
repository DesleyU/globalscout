using GlobalScout.Application.Abstractions.Auth;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Domain.Identity;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Account.DowngradeAccount;

internal sealed class DowngradeAccountCommandHandler(IUserIdentityStore identityStore)
    : ICommandHandler<DowngradeAccountCommand, AccountType>
{
    public Task<Result<AccountType>> Handle(DowngradeAccountCommand command, CancellationToken cancellationToken) =>
        identityStore.SetAccountTierAsync(command.UserId, AccountType.Basic, cancellationToken);
}
