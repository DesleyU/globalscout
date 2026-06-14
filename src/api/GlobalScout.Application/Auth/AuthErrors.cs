using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Auth;

public static class AuthErrors
{
    public static readonly Error EmailTaken =
        Error.Conflict("Auth.EmailTaken", "User already exists with this email.");

    public static readonly Error InvalidCredentials =
        Error.Validation("Auth.InvalidCredentials", "Invalid email or password.");

    public static readonly Error UserNotFound =
        Error.NotFound("Auth.UserNotFound", "User was not found.");
}
