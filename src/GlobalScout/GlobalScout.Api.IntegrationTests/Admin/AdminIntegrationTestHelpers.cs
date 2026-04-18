using GlobalScout.Application.Abstractions.Auth;
using GlobalScout.Domain.Identity;
using GlobalScout.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;

namespace GlobalScout.Api.IntegrationTests.Admin;

internal static class AdminIntegrationTestHelpers
{
    public static async Task<(Guid UserId, string Token)> CreateAdminUserAsync(WebApplicationFactory<Program> factory)
    {
        using var scope = factory.Services.CreateScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var jwt = scope.ServiceProvider.GetRequiredService<IJwtTokenIssuer>();

        var email = $"admin-{Guid.NewGuid():N}@example.com";
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = email,
            Email = email,
            EmailConfirmed = true,
            Status = UserStatus.Active,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        IdentityResult create = await userManager.CreateAsync(user, "SecretPassword12!");
        if (!create.Succeeded)
        {
            throw new InvalidOperationException(string.Join(", ", create.Errors.Select(e => e.Description)));
        }

        IdentityResult roleResult = await userManager.AddToRoleAsync(user, AppRoleNames.Admin);
        if (!roleResult.Succeeded)
        {
            throw new InvalidOperationException(string.Join(", ", roleResult.Errors.Select(e => e.Description)));
        }

        string token = jwt.IssueAccessToken(user.Id, email, AppRoleNames.Admin);
        return (user.Id, token);
    }
}
