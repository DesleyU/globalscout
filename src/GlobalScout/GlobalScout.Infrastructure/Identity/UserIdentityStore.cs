using GlobalScout.Application.Abstractions.Auth;
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
        var roleName = command.Role.Trim().ToUpperInvariant();

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

        if (string.Equals(roleName, AppRoleNames.Player, StringComparison.Ordinal))
        {
            if (command.Position is not null && TryParsePosition(command.Position, out var pos))
            {
                profile.Position = pos;
            }

            profile.Age = command.Age;
        }
        else if (string.Equals(roleName, AppRoleNames.Club, StringComparison.Ordinal))
        {
            profile.ClubName = command.ClubName?.Trim();
        }

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
        var roleName = roles.FirstOrDefault() ?? AppRoleNames.Player;
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
        var roleName = roles.FirstOrDefault() ?? AppRoleNames.Player;

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
