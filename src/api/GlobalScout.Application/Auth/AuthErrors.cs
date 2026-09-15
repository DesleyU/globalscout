using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Auth;

public static class AuthErrors
{
    public static readonly Error EmailTaken =
        Error.Conflict("Auth.EmailTaken", "User already exists with this email.");

    public static readonly Error InvalidCredentials =
        Error.Unauthorized("Auth.InvalidCredentials", "Invalid email or password.");

    public static readonly Error UserNotFound =
        Error.NotFound("Auth.UserNotFound", "User was not found.");

    public static readonly Error InvalidOrExpiredVerificationToken =
        Error.Problem("Auth.InvalidVerificationToken", "This verification link is invalid or has expired.");

    public static readonly Error EmailAlreadyVerified =
        Error.Conflict("Auth.EmailAlreadyVerified", "Your email is already verified.");

    public static readonly Error VerificationEmailCooldown =
        Error.TooManyRequests(
            "Auth.VerificationEmailCooldown",
            "Please wait before requesting another verification email.");

    public static readonly Error EmailNotVerified =
        Error.Forbidden(
            "Auth.EmailNotVerified",
            "Please verify your email address before doing this.");
}
