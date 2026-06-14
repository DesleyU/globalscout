using System.Security.Claims;
using GlobalScout.Domain.Identity;

namespace GlobalScout.Api.Infrastructure;

internal static class HttpUser
{
    public static Guid? ResolveId(ClaimsPrincipal principal)
    {
        var sub = principal.FindFirstValue(ClaimTypes.NameIdentifier)
                  ?? principal.FindFirstValue("sub");
        return Guid.TryParse(sub, out var id) ? id : null;
    }

    public static UserRole ResolveRole(ClaimsPrincipal principal)
    {
        var role = principal.FindFirstValue(ClaimTypes.Role);
        if (string.IsNullOrWhiteSpace(role))
        {
            return UserRole.Player;
        }

        return AppRoleNames.ToUserRole(role.Trim().ToUpperInvariant());
    }
}
