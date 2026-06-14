using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Users;

public static class UsersErrors
{
    public static readonly Error UserNotFound =
        Error.NotFound("Users.NotFound", "User not found.");

    public static readonly Error NoFileUploaded =
        Error.Validation("Users.Avatar.Missing", "No file uploaded.");

    public static readonly Error PlayerIdTaken =
        Error.Problem("Users.PlayerIdTaken", "This player ID is already associated with another account.");
}
