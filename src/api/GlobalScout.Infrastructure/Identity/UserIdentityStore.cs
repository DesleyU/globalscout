using GlobalScout.Application.Abstractions.Auth;
using GlobalScout.Application.Account;
using GlobalScout.Application.Account.SetRole;
using GlobalScout.Application.Auth;
using GlobalScout.Application.Auth.GetProfile;
using GlobalScout.Application.Auth.Login;
using GlobalScout.Application.Auth.Register;
using GlobalScout.Domain.Identity;
using GlobalScout.Infrastructure.Data;
using GlobalScout.Domain.Users;
using GlobalScout.SharedKernel;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace GlobalScout.Infrastructure.Identity;

internal sealed class UserIdentityStore(
    UserManager<ApplicationUser> userManager,
    GlobalScoutDbContext db,
    ILogger<UserIdentityStore> logger) : IUserIdentityStore
{
    public async Task<Result<RegisterUserOutcome>> RegisterAsync(
        RegisterUserCommand command,
        CancellationToken cancellationToken)
    {
        var normalizedEmail = command.Email.Trim().ToLowerInvariant();
        const string roleName = AppRoleNames.Pending;

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

        var create = await userManager.CreateAsync(user, command.Password);
        if (!create.Succeeded)
        {
            if (create.Errors.Any(e => e.Code is "DuplicateEmail" or "DuplicateUserName"))
            {
                return Result.Failure<RegisterUserOutcome>(AuthErrors.EmailTaken);
            }

            logger.LogWarning("User create failed: {Errors}", string.Join(", ", create.Errors.Select(e => $"{e.Code}:{e.Description}")));
            return Result.Failure<RegisterUserOutcome>(
                Error.Problem("Auth.RegistrationFailed", "Registration could not be completed."));
        }

        var addRole = await userManager.AddToRoleAsync(user, roleName);
        if (!addRole.Succeeded)
        {
            logger.LogWarning("AddToRole failed: {Errors}", string.Join(", ", addRole.Errors.Select(e => e.Description)));
            await userManager.DeleteAsync(user);
            return Result.Failure<RegisterUserOutcome>(
                Error.Problem("Auth.RoleAssignmentFailed", "Could not assign role to the new user."));
        }

        var profile = new Profile
        {
            UserId = user.Id,
            FirstName = command.FirstName.Trim(),
            LastName = command.LastName.Trim(),
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        db.Profiles.Add(profile);
        await db.SaveChangesAsync(cancellationToken);

        var regProfile = new RegistrationProfileDto(
            profile.FirstName,
            profile.LastName,
            PositionToApi(profile.Position),
            profile.Age,
            profile.ClubName);

        return Result.Success(new RegisterUserOutcome(user.Id, user.Email!, roleName, regProfile));
    }

    public async Task<Result<SetUserRoleOutcome>> SetRoleAsync(
        Guid userId,
        string newRole,
        CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null)
        {
            return Result.Failure<SetUserRoleOutcome>(AccountErrors.UserNotFound);
        }

        var roles = await userManager.GetRolesAsync(user);
        if (!roles.Any(r => string.Equals(r, AppRoleNames.Pending, StringComparison.Ordinal)))
        {
            return Result.Failure<SetUserRoleOutcome>(AccountErrors.RoleNotPending);
        }

        var roleName = newRole.Trim().ToUpperInvariant();

        if (roles.Count > 0)
        {
            var remove = await userManager.RemoveFromRolesAsync(user, roles);
            if (!remove.Succeeded)
            {
                logger.LogWarning(
                    "RemoveFromRoles failed: {Errors}",
                    string.Join(", ", remove.Errors.Select(e => e.Description)));
                return Result.Failure<SetUserRoleOutcome>(
                    Error.Problem("Account.RoleUpdateFailed", "Could not update account role."));
            }
        }

        var addRole = await userManager.AddToRoleAsync(user, roleName);
        if (!addRole.Succeeded)
        {
            logger.LogWarning(
                "AddToRole failed: {Errors}",
                string.Join(", ", addRole.Errors.Select(e => e.Description)));
            return Result.Failure<SetUserRoleOutcome>(
                Error.Problem("Account.RoleUpdateFailed", "Could not update account role."));
        }

        var profile = await db.Profiles.AsNoTracking()
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);

        var payload = profile is null
            ? new AuthProfilePayload(string.Empty, string.Empty, null, null, null)
            : new AuthProfilePayload(
                profile.FirstName,
                profile.LastName,
                PositionToApi(profile.Position),
                profile.Age,
                profile.ClubName);

        return Result.Success(new SetUserRoleOutcome(user.Id, user.Email!, roleName, payload));
    }

    public async Task<Result<LoginUserOutcome>> ValidateLoginAsync(
        LoginUserCommand command,
        CancellationToken cancellationToken)
    {
        var user = await userManager.FindByEmailAsync(command.Email.Trim().ToLowerInvariant());
        if (user is null)
        {
            return Result.Failure<LoginUserOutcome>(AuthErrors.InvalidCredentials);
        }

        var valid = await userManager.CheckPasswordAsync(user, command.Password);
        if (!valid)
        {
            return Result.Failure<LoginUserOutcome>(AuthErrors.InvalidCredentials);
        }

        var roles = await userManager.GetRolesAsync(user);
        var roleName = roles.FirstOrDefault() ?? AppRoleNames.Pending;
        var profile = await db.Profiles.AsNoTracking().FirstOrDefaultAsync(p => p.UserId == user.Id, cancellationToken);

        var loginProfile = profile is null
            ? new LoginProfileDto(string.Empty, string.Empty, null, null, null)
            : new LoginProfileDto(
                profile.FirstName,
                profile.LastName,
                PositionToApi(profile.Position),
                profile.Age,
                profile.ClubName);

        return Result.Success(new LoginUserOutcome(
            user.Id,
            user.Email!,
            roleName,
            AppRoleNames.ToUserRole(roleName),
            user.AccountType,
            loginProfile));
    }

    public async Task<Result<GetAuthProfileResult?>> GetProfileAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await userManager.Users
            .Include(u => u.Profile)
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user is null)
        {
            return Result.Success<GetAuthProfileResult?>(null);
        }

        var roles = await userManager.GetRolesAsync(user);
        var roleName = roles.FirstOrDefault() ?? AppRoleNames.Pending;

        if (user.Profile is null)
        {
            return Result.Success<GetAuthProfileResult?>(new GetAuthProfileResult(
                user.Id,
                user.Email!,
                roleName,
                user.Status,
                user.AccountType,
                new AuthProfilePayload(string.Empty, string.Empty, null, null, null)));
        }

        var p = user.Profile;
        var payload = new AuthProfilePayload(
            p.FirstName,
            p.LastName,
            PositionToApi(p.Position),
            p.Age,
            p.ClubName);

        return Result.Success<GetAuthProfileResult?>(new GetAuthProfileResult(
            user.Id,
            user.Email!,
            roleName,
            user.Status,
            user.AccountType,
            payload));
    }

    public async Task<AccountSummary?> GetAccountSummaryAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await userManager.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        if (user is null)
        {
            return null;
        }

        return new AccountSummary(user.Id, user.Email!, user.AccountType, user.CreatedAt);
    }

    public async Task<Result<AccountType>> SetAccountTierAsync(
        Guid userId,
        AccountType targetTier,
        CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null)
        {
            return Result.Failure<AccountType>(AccountErrors.UserNotFound);
        }

        if (user.AccountType == targetTier)
        {
            var err = targetTier == AccountType.Premium ? AccountErrors.AlreadyPremium : AccountErrors.AlreadyBasic;
            return Result.Failure<AccountType>(err);
        }

        user.AccountType = targetTier;
        user.UpdatedAt = DateTimeOffset.UtcNow;
        var update = await userManager.UpdateAsync(user);
        if (!update.Succeeded)
        {
            logger.LogWarning(
                "Account tier update failed: {Errors}",
                string.Join(", ", update.Errors.Select(e => $"{e.Code}:{e.Description}")));
            return Result.Failure<AccountType>(
                Error.Problem("Account.UpdateFailed", "Failed to update account."));
        }

        return Result.Success(targetTier);
    }

    public async Task<Result> SetAccountTierFromBillingAsync(
        Guid userId,
        AccountType targetTier,
        CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null)
        {
            return Result.Failure(AccountErrors.UserNotFound);
        }

        if (user.AccountType == targetTier)
        {
            return Result.Success();
        }

        user.AccountType = targetTier;
        user.UpdatedAt = DateTimeOffset.UtcNow;
        var update = await userManager.UpdateAsync(user);
        if (!update.Succeeded)
        {
            logger.LogWarning(
                "Billing account tier update failed: {Errors}",
                string.Join(", ", update.Errors.Select(e => $"{e.Code}:{e.Description}")));
            return Result.Failure(
                Error.Problem("Account.BillingUpdateFailed", "Failed to update account from billing."));
        }

        return Result.Success();
    }

    public async Task<string?> GetStripeCustomerIdAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await userManager.Users.AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        return user?.StripeCustomerId;
    }

    private static string? PositionToApi(Position? position) =>
        position switch
        {
            null => null,
            Position.Goalkeeper => "GOALKEEPER",
            Position.Defender => "DEFENDER",
            Position.Midfielder => "MIDFIELDER",
            Position.Forward => "FORWARD",
            _ => null
        };

    private static bool TryParsePosition(string value, out Position position)
    {
        position = default;
        switch (value.Trim().ToUpperInvariant())
        {
            case "GOALKEEPER":
                position = Position.Goalkeeper;
                return true;
            case "DEFENDER":
                position = Position.Defender;
                return true;
            case "MIDFIELDER":
                position = Position.Midfielder;
                return true;
            case "FORWARD":
                position = Position.Forward;
                return true;
            default:
                return false;
        }
    }
}
