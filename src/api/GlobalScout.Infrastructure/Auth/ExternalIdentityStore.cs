using GlobalScout.Application.Abstractions.Auth;
using GlobalScout.Application.Auth;
using GlobalScout.Domain.Identity;
using GlobalScout.Infrastructure.Identity;
using GlobalScout.SharedKernel;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;

namespace GlobalScout.Infrastructure.Auth;

internal sealed class ExternalIdentityStore(
    UserManager<ApplicationUser> userManager,
    ApplicationUserCreator userCreator,
    ILogger<ExternalIdentityStore> logger) : IExternalIdentityStore
{
    /// <summary>
    /// Placeholder email domain used only when a provider supplies no email at all (FR-004). ASP.NET
    /// Core Identity's <c>RequireUniqueEmail</c> setting (see DependencyInjection.AddGlobalScoutIdentity)
    /// rejects a null/empty email outright, so a non-deliverable, per-identity-unique placeholder is
    /// synthesized instead of leaving Email null. EmailConfirmed is left false in that case.
    /// </summary>
    private const string PlaceholderEmailDomain = "users.globalscout.eu";

    public async Task<Guid?> FindUserIdByLoginAsync(string provider, string providerKey, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByLoginAsync(provider, providerKey);
        return user?.Id;
    }

    public async Task<Guid?> FindUserIdByEmailAsync(string email, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByEmailAsync(email.Trim().ToLowerInvariant());
        return user?.Id;
    }

    public async Task<Result> LinkLoginAsync(Guid userId, string provider, string providerKey, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId.ToString());
        if (user is null)
        {
            return Result.Failure(AuthErrors.UserNotFound);
        }

        var login = new UserLoginInfo(provider, providerKey, provider);
        var result = await userManager.AddLoginAsync(user, login);
        if (!result.Succeeded)
        {
            logger.LogWarning(
                "AddLogin failed while auto-linking: {Errors}",
                string.Join(", ", result.Errors.Select(e => $"{e.Code}:{e.Description}")));
            return Result.Failure(Error.Problem("ExternalLogin.LinkFailed", "Could not link the identity provider to this account."));
        }

        return Result.Success();
    }

    public async Task<Result<Guid>> CreateUserWithLoginAsync(ExternalLoginInfoDto info, CancellationToken cancellationToken)
    {
        var hasRealEmail = !string.IsNullOrWhiteSpace(info.Email);
        var normalizedEmail = hasRealEmail
            ? info.Email!.Trim().ToLowerInvariant()
            : $"{info.Provider.ToLowerInvariant()}-{info.ProviderKey}@{PlaceholderEmailDomain}";
        var age = info.Age ?? (info.DateOfBirth is { } dob ? ComputeAge(dob) : null);

        var created = await userCreator.CreateAsync(
            email: normalizedEmail,
            emailConfirmed: hasRealEmail && info.EmailVerified,
            password: null,
            roleName: AppRoleNames.Pending,
            firstName: info.FirstName?.Trim() ?? string.Empty,
            lastName: info.LastName?.Trim() ?? string.Empty,
            age: age,
            cancellationToken);

        if (created.IsFailure)
        {
            return Result.Failure<Guid>(created.Error);
        }

        var user = created.Value;

        var addLogin = await userManager.AddLoginAsync(user, new UserLoginInfo(info.Provider, info.ProviderKey, info.Provider));
        if (!addLogin.Succeeded)
        {
            logger.LogWarning(
                "AddLogin failed on create: {Errors}",
                string.Join(", ", addLogin.Errors.Select(e => e.Description)));
            await userManager.DeleteAsync(user);
            return Result.Failure<Guid>(Error.Problem("Auth.ExternalLoginLinkFailed", "Could not link the identity provider."));
        }

        return Result.Success(user.Id);
    }

    private static int ComputeAge(DateOnly dateOfBirth)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var age = today.Year - dateOfBirth.Year;
        if (dateOfBirth > today.AddYears(-age))
        {
            age--;
        }

        return age;
    }
}
