using GlobalScout.Domain.Identity;
using GlobalScout.Domain.Users;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace GlobalScout.Infrastructure.Identity;

public static class IdentityDataSeeder
{
    public static async Task SeedRolesAsync(IServiceProvider services, CancellationToken cancellationToken = default)
    {
        using var scope = services.CreateScope();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<ApplicationRole>>();

        foreach (var name in AppRoleNames.All)
        {
            cancellationToken.ThrowIfCancellationRequested();
            if (await roleManager.RoleExistsAsync(name))
            {
                continue;
            }

            var role = new ApplicationRole
            {
                Id = Guid.NewGuid(),
                Name = name,
                NormalizedName = name.ToUpperInvariant()
            };

            var result = await roleManager.CreateAsync(role);
            if (!result.Succeeded)
            {
                throw new InvalidOperationException(
                    $"Failed to create role {name}: {string.Join(", ", result.Errors.Select(e => e.Description))}");
            }
        }
    }

    public static async Task SeedAdminUserAsync(
        IServiceProvider services,
        ILogger logger,
        CancellationToken cancellationToken = default)
    {
        using var scope = services.CreateScope();
        var options = scope.ServiceProvider.GetRequiredService<IOptions<AdminSeedOptions>>().Value;

        if (string.IsNullOrWhiteSpace(options.Email) || string.IsNullOrWhiteSpace(options.Password))
        {
            logger.LogDebug("Admin seed skipped: AdminSeed:Email or AdminSeed:Password is not configured.");
            return;
        }

        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var normalizedEmail = options.Email.Trim().ToLowerInvariant();
        var existingUser = await userManager.FindByEmailAsync(normalizedEmail);

        if (existingUser is null)
        {
            var user = new ApplicationUser
            {
                Id = Guid.NewGuid(),
                UserName = normalizedEmail,
                Email = normalizedEmail,
                NormalizedEmail = normalizedEmail.ToUpperInvariant(),
                NormalizedUserName = normalizedEmail.ToUpperInvariant(),
                EmailConfirmed = true,
                Status = UserStatus.Active,
                AccountType = AccountType.Basic,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };

            var create = await userManager.CreateAsync(user, options.Password);
            if (!create.Succeeded)
            {
                throw new InvalidOperationException(
                    $"Failed to seed admin user: {string.Join(", ", create.Errors.Select(e => e.Description))}");
            }

            var addRole = await userManager.AddToRoleAsync(user, AppRoleNames.Admin);
            if (!addRole.Succeeded)
            {
                throw new InvalidOperationException(
                    $"Failed to assign admin role to seeded user: {string.Join(", ", addRole.Errors.Select(e => e.Description))}");
            }

            logger.LogInformation("Seeded bootstrap admin user {Email}.", normalizedEmail);
            return;
        }

        var roles = await userManager.GetRolesAsync(existingUser);
        if (roles.Contains(AppRoleNames.Admin, StringComparer.Ordinal))
        {
            return;
        }

        var repairRole = await userManager.AddToRoleAsync(existingUser, AppRoleNames.Admin);
        if (!repairRole.Succeeded)
        {
            throw new InvalidOperationException(
                $"Failed to repair admin role for seeded user: {string.Join(", ", repairRole.Errors.Select(e => e.Description))}");
        }

        logger.LogInformation("Repaired ADMIN role for bootstrap admin user {Email}.", normalizedEmail);
    }
}
