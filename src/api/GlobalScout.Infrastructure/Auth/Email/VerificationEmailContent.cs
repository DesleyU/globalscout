using System.Text;
using GlobalScout.Infrastructure.Auth;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;

namespace GlobalScout.Infrastructure.Auth.Email;

/// <summary>
/// Builds the subject/body for the account-email-verification message, shared by both the initial
/// send at registration and every resend, and encodes/decodes the single opaque "token" string the
/// public contract exposes.
///
/// ASP.NET Core Identity's <c>ConfirmEmailAsync(user, token)</c> requires the target
/// <see cref="Identity.ApplicationUser"/> to already be resolved - the raw token alone carries no
/// lookup key. Since the public contract is a single opaque token (no separate user identifier -
/// see contracts/auth-email-verification.md), the user id is embedded alongside the raw token
/// before base64url-encoding, so the link stays one opaque string while still letting the handler
/// resolve which account to check.
/// </summary>
internal sealed class VerificationEmailContent(IOptions<ExternalAuthOptions> authOptions)
{
    private const char Separator = ':';

    public static string Encode(Guid userId, string rawToken) =>
        WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes($"{userId:N}{Separator}{rawToken}"));

    public static bool TryDecode(string encodedToken, out Guid userId, out string rawToken)
    {
        userId = default;
        rawToken = string.Empty;

        try
        {
            var composite = Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(encodedToken));
            var separatorIndex = composite.IndexOf(Separator);
            if (separatorIndex <= 0 || separatorIndex == composite.Length - 1)
            {
                return false;
            }

            if (!Guid.TryParseExact(composite[..separatorIndex], "N", out userId))
            {
                return false;
            }

            rawToken = composite[(separatorIndex + 1)..];
            return true;
        }
        catch (FormatException)
        {
            return false;
        }
    }

    public (string Subject, string HtmlBody) Build(Guid userId, string rawToken)
    {
        var frontendBaseUrl = authOptions.Value.FrontendBaseUrl.TrimEnd('/');
        var encodedToken = Encode(userId, rawToken);
        var link = $"{frontendBaseUrl}/verify-email?token={Uri.EscapeDataString(encodedToken)}";

        const string subject = "Verify your GlobalScout email address";
        var htmlBody = $"""
            <p>Welcome to GlobalScout!</p>
            <p>Please confirm your email address by clicking the link below. This link expires in 24 hours.</p>
            <p><a href="{link}">Verify my email address</a></p>
            <p>If you didn't create a GlobalScout account, you can safely ignore this email.</p>
            """;

        return (subject, htmlBody);
    }
}
