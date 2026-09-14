using System.Security.Claims;
using GlobalScout.Application.Abstractions.Auth;
using GlobalScout.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;

namespace GlobalScout.Infrastructure.Auth;

/// <summary>
/// Production implementation: wraps ASP.NET Core Identity's <c>SignInManager.GetExternalLoginInfoAsync()</c>,
/// reading whatever the provider's remote-authentication handler put on the temporary external-sign-in
/// cookie for the current request. See specs/001-oauth2-signup/research.md for the per-provider
/// "verified email" rules this implements.
/// </summary>
internal sealed class ExternalLoginAccessor(SignInManager<ApplicationUser> signInManager) : IExternalLoginAccessor
{
    public async Task<ExternalLoginInfoDto?> GetExternalLoginInfoAsync(CancellationToken cancellationToken)
    {
        var info = await signInManager.GetExternalLoginInfoAsync();
        if (info is null)
        {
            return null;
        }

        var principal = info.Principal;
        var email = principal.FindFirstValue(ClaimTypes.Email);
        var emailVerified = ResolveEmailVerified(info.LoginProvider, email, principal);
        var firstName = principal.FindFirstValue(ClaimTypes.GivenName);
        var lastName = principal.FindFirstValue(ClaimTypes.Surname);
        var dateOfBirth = TryParseDateOfBirth(principal);

        return new ExternalLoginInfoDto(
            info.LoginProvider,
            info.ProviderKey,
            email,
            emailVerified,
            firstName,
            lastName,
            null,
            dateOfBirth);
    }

    private static bool ResolveEmailVerified(string provider, string? email, ClaimsPrincipal principal)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return false;
        }

        // Facebook's Graph API only ever returns `email` for addresses it has already verified with the
        // account holder - its presence in the response is the verification signal.
        if (string.Equals(provider, "Facebook", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        // Google and Apple both surface an `email_verified` claim on the ID token (Apple's is the
        // string "true"/"false" per its JWT spec, which OrdinalIgnoreCase-compares fine here too).
        var raw = principal.FindFirstValue("email_verified");
        return string.Equals(raw, "true", StringComparison.OrdinalIgnoreCase);
    }

    private static DateOnly? TryParseDateOfBirth(ClaimsPrincipal principal)
    {
        var raw = principal.FindFirstValue(ClaimTypes.DateOfBirth);
        return DateOnly.TryParse(raw, out var dob) ? dob : null;
    }
}
