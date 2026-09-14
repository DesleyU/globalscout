using GlobalScout.Application.Auth;
using GlobalScout.Domain.Identity;
using GlobalScout.Domain.Users;
using GlobalScout.Infrastructure.Data;
using GlobalScout.SharedKernel;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;

namespace GlobalScout.Infrastructure.Identity;

/// <summary>
/// Shared account-creation skeleton for both registration paths (password via
/// <see cref="UserIdentityStore"/>, OAuth2 via <c>ExternalIdentityStore</c>): build the
/// <see cref="ApplicationUser"/>, create it, assign the given role, create its <see cref="Profile"/> row,
/// rolling back the user on any failed step. Callers own everything specific to their own path -
/// password vs. passwordless creation, and (for OAuth) linking the provider login afterward.
/// </summary>
internal sealed class ApplicationUserCreator(
    UserManager<ApplicationUser> userManager,
    GlobalScoutDbContext db,
    ILogger<ApplicationUserCreator> logger)
{
    public async Task<Result<ApplicationUser>> CreateAsync(
        string email,
        bool emailConfirmed,
        string? password,
        string roleName,
        string firstName,
        string lastName,
        int? age,
        CancellationToken cancellationToken)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = normalizedEmail,
            Email = normalizedEmail,
            NormalizedEmail = normalizedEmail.ToUpperInvariant(),
            NormalizedUserName = normalizedEmail.ToUpperInvariant(),
            EmailConfirmed = emailConfirmed,
            Status = UserStatus.Active,
            AccountType = AccountType.Basic,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        var create = password is null
            ? await userManager.CreateAsync(user)
            : await userManager.CreateAsync(user, password);

        if (!create.Succeeded)
        {
            if (create.Errors.Any(e => e.Code is "DuplicateEmail" or "DuplicateUserName"))
            {
                return Result.Failure<ApplicationUser>(AuthErrors.EmailTaken);
            }

            logger.LogWarning(
                "User create failed: {Errors}",
                string.Join(", ", create.Errors.Select(e => $"{e.Code}:{e.Description}")));
            return Result.Failure<ApplicationUser>(
                Error.Problem("Auth.RegistrationFailed", "Registration could not be completed."));
        }

        var addRole = await userManager.AddToRoleAsync(user, roleName);
        if (!addRole.Succeeded)
        {
            logger.LogWarning(
                "AddToRole failed: {Errors}",
                string.Join(", ", addRole.Errors.Select(e => e.Description)));
            await userManager.DeleteAsync(user);
            return Result.Failure<ApplicationUser>(
                Error.Problem("Auth.RoleAssignmentFailed", "Could not assign role to the new user."));
        }

        var profile = new Profile
        {
            UserId = user.Id,
            FirstName = firstName,
            LastName = lastName,
            Age = age,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        db.Profiles.Add(profile);
        await db.SaveChangesAsync(cancellationToken);

        return Result.Success(user);
    }
}
