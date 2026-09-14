using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Auth.ExternalLogin;

public static class ExternalLoginErrors
{
    public static readonly Error UnderAge = Error.Forbidden(
        "ExternalLogin.UnderAge",
        "You must be at least 16 years old to create a GlobalScout account.");

    public static readonly Error EmailInUse = Error.Conflict(
        "ExternalLogin.EmailInUse",
        "An account with this email already exists. Sign in using your original method.");

    public static readonly Error ProviderError = Error.Problem(
        "ExternalLogin.ProviderError",
        "The identity provider did not return a valid response.");

    public static readonly Error AccessDenied = Error.Problem(
        "ExternalLogin.AccessDenied",
        "Sign-up was not completed.");

    public static readonly Error InvalidHandoffCode = Error.Validation(
        "ExternalLogin.InvalidHandoffCode",
        "This sign-in link has expired or already been used.");
}
