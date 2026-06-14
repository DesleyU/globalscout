using System.Security.Claims;
using GlobalScout.Application.PlayerIdentity;
using GlobalScout.Domain.Identity;

namespace GlobalScout.Api.Infrastructure;

internal static class HttpPlayer
{
    public static IResult? RequirePlayer(ClaimsPrincipal principal, out Guid userId)
    {
        userId = default;
        var id = HttpUser.ResolveId(principal);
        if (id is null)
        {
            return Results.Unauthorized();
        }

        if (HttpUser.ResolveRole(principal) != UserRole.Player)
        {
            return CustomResults.Problem(PlayerIdentityErrors.OnlyPlayers);
        }

        userId = id.Value;
        return null;
    }
}
