using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Account;

public static class AccountErrors
{
    public static readonly Error UserNotFound =
        Error.NotFound("Account.UserNotFound", "User not found.");

    public static readonly Error AlreadyPremium =
        Error.Problem("Account.AlreadyPremium", "Account is already premium");

    public static readonly Error AlreadyBasic =
        Error.Problem("Account.AlreadyBasic", "Account is already basic");
}
