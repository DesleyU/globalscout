using GlobalScout.Application.Abstractions.Auth;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Subscriptions;
using GlobalScout.Domain.Identity;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Account.GetAccountInfo;

internal sealed class GetAccountInfoQueryHandler(IUserIdentityStore identityStore)
    : IQueryHandler<GetAccountInfoQuery, GetAccountInfoResult>
{
    public async Task<Result<GetAccountInfoResult>> Handle(
        GetAccountInfoQuery query,
        CancellationToken cancellationToken)
    {
        var summary = await identityStore.GetAccountSummaryAsync(query.UserId, cancellationToken);
        if (summary is null)
        {
            return Result.Failure<GetAccountInfoResult>(AccountErrors.UserNotFound);
        }

        var tier = AccountTypeToApi(summary.AccountType);
        var limits = AccountLimitsForApi.ForTier(summary.AccountType);

        return Result.Success(
            new GetAccountInfoResult(
                summary.Id,
                summary.Email,
                tier,
                summary.CreatedAt,
                limits));
    }

    private static string AccountTypeToApi(AccountType a) => a.ToString().ToUpperInvariant();
}
