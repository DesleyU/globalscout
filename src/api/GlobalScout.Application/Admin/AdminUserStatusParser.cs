using GlobalScout.Domain.Identity;

namespace GlobalScout.Application.Admin;

public static class AdminUserStatusParser
{
    public static bool TryParse(string? value, out UserStatus status)
    {
        status = default;
        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        return value.Trim().ToUpperInvariant() switch
        {
            "ACTIVE" => Set(UserStatus.Active, out status),
            "BLOCKED" => Set(UserStatus.Blocked, out status),
            "PENDING" => Set(UserStatus.Pending, out status),
            _ => false
        };
    }

    private static bool Set(UserStatus s, out UserStatus status)
    {
        status = s;
        return true;
    }
}
