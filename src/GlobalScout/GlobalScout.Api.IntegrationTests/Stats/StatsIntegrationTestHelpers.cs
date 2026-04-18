using GlobalScout.Domain.Identity;
using GlobalScout.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;

namespace GlobalScout.Api.IntegrationTests.Stats;

internal static class StatsIntegrationTestHelpers
{
    public static async Task SetAccountTypeAsync(
        WebApplicationFactory<Program> factory,
        Guid userId,
        AccountType accountType,
        CancellationToken cancellationToken)
    {
        using var scope = factory.Services.CreateScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        ApplicationUser? user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null)
        {
            throw new InvalidOperationException("User not found.");
        }

        user.AccountType = accountType;
        IdentityResult update = await userManager.UpdateAsync(user);
        if (!update.Succeeded)
        {
            throw new InvalidOperationException(string.Join(", ", update.Errors.Select(e => e.Description)));
        }
    }
}
