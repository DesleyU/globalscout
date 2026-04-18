using GlobalScout.Application.Account;
using GlobalScout.Application.Auth;
using GlobalScout.Application.Auth.GetProfile;
using GlobalScout.Application.Auth.Login;
using GlobalScout.Application.Auth.Register;
using GlobalScout.Domain.Identity;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Abstractions.Auth;

public interface IUserIdentityStore
{
    Task<Result<RegisterUserOutcome>> RegisterAsync(RegisterUserCommand command, CancellationToken cancellationToken);

    Task<Result<LoginUserOutcome>> ValidateLoginAsync(LoginUserCommand command, CancellationToken cancellationToken);

    Task<Result<GetAuthProfileResult?>> GetProfileAsync(Guid userId, CancellationToken cancellationToken);

    Task<AccountSummary?> GetAccountSummaryAsync(Guid userId, CancellationToken cancellationToken);

    Task<Result<AccountType>> SetAccountTierAsync(Guid userId, AccountType targetTier, CancellationToken cancellationToken);

    /// <summary>Sets account tier from Stripe webhooks or billing sync. Idempotent when already at <paramref name="targetTier"/>.</summary>
    Task<Result> SetAccountTierFromBillingAsync(Guid userId, AccountType targetTier, CancellationToken cancellationToken);

    Task<string?> GetStripeCustomerIdAsync(Guid userId, CancellationToken cancellationToken);
}
