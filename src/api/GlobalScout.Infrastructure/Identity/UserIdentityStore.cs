using GlobalScout.Application.Abstractions.Auth;
using GlobalScout.Application.Abstractions.Email;
using GlobalScout.Application.Account;
using GlobalScout.Application.Account.SetRole;
using GlobalScout.Application.Auth;
using GlobalScout.Application.Auth.GetProfile;
using GlobalScout.Application.Auth.Login;
using GlobalScout.Application.Auth.Register;
using GlobalScout.Domain.Identity;
using GlobalScout.Infrastructure.Auth.Email;
using GlobalScout.Infrastructure.Data;
using GlobalScout.Domain.Users;
using GlobalScout.SharedKernel;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace GlobalScout.Infrastructure.Identity;

internal sealed class UserIdentityStore(
    UserManager<ApplicationUser> userManager,
    GlobalScoutDbContext db,
    ApplicationUserCreator userCreator,
    IEmailSender emailSender,
    VerificationEmailContent verificationEmailContent,
    IOptions<EmailOptions> emailOptions,
    ILogger<UserIdentityStore> logger) : IUserIdentityStore
{
    public async Task<Result<RegisterUserOutcome>> RegisterAsync(
        RegisterUserCommand command,
        CancellationToken cancellationToken)
    {
        const string roleName = AppRoleNames.Pending;
        var firstName = command.FirstName.Trim();
        var lastName = command.LastName.Trim();

        var created = await userCreator.CreateAsync(
            email: command.Email,
            emailConfirmed: false,
            password: command.Password,
            roleName: roleName,
            firstName: firstName,
            lastName: lastName,
            age: null,
            cancellationToken);

        if (created.IsFailure)
        {
            return Result.Failure<RegisterUserOutcome>(created.Error);
        }

        var user = created.Value;
        try
        {
            await SendVerificationEmailAsync(user, cancellationToken);
        }
        catch (Exception ex)
        {
            // Account creation already succeeded; a failed/undeliverable verification email is
            // recoverable via resend-verification and must not roll back registration.
            logger.LogWarning(ex, "Failed to send verification email to new user {UserId}.", user.Id);
        }

        var regProfile = new RegistrationProfileDto(firstName, lastName, null, null, null);

        return Result.Success(new RegisterUserOutcome(user.Id, user.Email!, roleName, regProfile));
    }

    public async Task<Result<VerifyEmailOutcome>> VerifyEmailAsync(
        string encodedToken,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        if (!VerificationEmailContent.TryDecode(encodedToken, out var userId, out var rawToken))
        {
            return Result.Failure<VerifyEmailOutcome>(AuthErrors.InvalidOrExpiredVerificationToken);
        }

        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null)
        {
            return Result.Failure<VerifyEmailOutcome>(AuthErrors.InvalidOrExpiredVerificationToken);
        }

        if (user.EmailConfirmed)
        {
            return Result.Success(VerifyEmailOutcome.AlreadyVerified);
        }

        var confirm = await userManager.ConfirmEmailAsync(user, rawToken);
        if (!confirm.Succeeded)
        {
            return Result.Failure<VerifyEmailOutcome>(AuthErrors.InvalidOrExpiredVerificationToken);
        }

        return Result.Success(VerifyEmailOutcome.NewlyVerified);
    }

    public async Task<Result> ResendVerificationEmailAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null)
        {
            return Result.Failure(AuthErrors.UserNotFound);
        }

        if (user.EmailConfirmed)
        {
            return Result.Failure(AuthErrors.EmailAlreadyVerified);
        }

        var cooldown = TimeSpan.FromSeconds(emailOptions.Value.VerificationResendCooldownSeconds);
        if (user.LastVerificationEmailSentAt is { } lastSent && DateTimeOffset.UtcNow - lastSent < cooldown)
        {
            return Result.Failure(AuthErrors.VerificationEmailCooldown);
        }

        // Rotating the security stamp invalidates any previously issued, still-outstanding
        // confirmation token for this account, since that token was signed against the old stamp.
        // Note: this also invalidates any other Identity token type sharing the same stamp (e.g. a
        // future password-reset token) - not a conflict today since no such feature exists yet.
        await userManager.UpdateSecurityStampAsync(user);

        await SendVerificationEmailAsync(user, cancellationToken);

        // Only tracked on an explicit resend - not on the automatic send at registration - so the
        // cooldown throttles repeated resend requests (FR-010) without spuriously blocking someone's
        // very first resend just because it happens soon after signing up.
        user.LastVerificationEmailSentAt = DateTimeOffset.UtcNow;
        await userManager.UpdateAsync(user);

        return Result.Success();
    }

    public async Task<bool> IsEmailConfirmedAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await userManager.Users.AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        return user?.EmailConfirmed ?? false;
    }

    private async Task SendVerificationEmailAsync(ApplicationUser user, CancellationToken cancellationToken)
    {
        var token = await userManager.GenerateEmailConfirmationTokenAsync(user);
        var (subject, htmlBody) = verificationEmailContent.Build(user.Id, token);
        // TEMP DEBUG - remove after manual testing: Ministack only logs the subject, not the body,
        // so there's no other way to recover the real link for manual click-through right now.
        logger.LogInformation("DEV-ONLY verification email body for {UserId}: {HtmlBody}", user.Id, htmlBody);
        await emailSender.SendAsync(user.Email!, subject, htmlBody, cancellationToken);
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
                user.EmailConfirmed,
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
            user.EmailConfirmed,
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
