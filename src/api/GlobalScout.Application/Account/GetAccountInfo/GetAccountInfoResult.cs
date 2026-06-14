namespace GlobalScout.Application.Account.GetAccountInfo;

public sealed record GetAccountInfoResult(
    Guid Id,
    string Email,
    string AccountType,
    DateTimeOffset CreatedAt,
    object Limits);
