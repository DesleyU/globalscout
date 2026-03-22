using GlobalScout.Application.Abstractions.Persistence;
using GlobalScout.Domain.Identity;
using GlobalScout.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace GlobalScout.Infrastructure.Persistence;

internal sealed class UserRepository(UserManager<ApplicationUser> userManager)
    : IUserRepository
{
    public async Task<UserSummary?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(id.ToString());
        if (user is null)
        {
            return null;
        }

        var roles = await userManager.GetRolesAsync(user);
        var roleName = roles.FirstOrDefault() ?? AppRoleNames.Player;
        return new UserSummary(user.Id, user.Email!, AppRoleNames.ToUserRole(roleName), user.Status, user.AccountType);
    }
}
