using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Admin;

public static class AdminErrors
{
    public static Error InvalidStatus() =>
        Error.Problem("Admin.InvalidStatus", "Invalid status. Use ACTIVE, BLOCKED, or PENDING.");

    public static Error UserNotFound() =>
        Error.NotFound("Admin.UserNotFound", "User not found.");

    public static Error CannotBlockSelf() =>
        Error.Problem("Admin.CannotBlockSelf", "Cannot block yourself.");

    public static Error CannotDeleteSelf() =>
        Error.Problem("Admin.CannotDeleteSelf", "Cannot delete yourself.");
}
