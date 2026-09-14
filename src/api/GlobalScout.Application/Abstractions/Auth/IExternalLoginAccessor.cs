namespace GlobalScout.Application.Abstractions.Auth;

/// <summary>
/// Reads the outcome of the third-party OAuth2 handshake for the current request. In production this
/// wraps ASP.NET Core Identity's <c>SignInManager.GetExternalLoginInfoAsync()</c> (see
/// GlobalScout.Infrastructure.Auth.ExternalLoginAccessor); in integration tests it is replaced with a
/// fake that returns a fixed, scenario-controlled result in place of the live Google/Facebook/Apple
/// network hop, per specs/001-oauth2-signup/research.md's testing-strategy decision. This is the only
/// seam that gets substituted for tests — everything downstream (find/create/link, JWT issuance) runs
/// against real Postgres.
/// </summary>
public interface IExternalLoginAccessor
{
    Task<ExternalLoginInfoDto?> GetExternalLoginInfoAsync(CancellationToken cancellationToken);
}

/// <summary>The same shape ASP.NET Core Identity's <c>ExternalLoginInfo</c> conveys, normalized for our use.</summary>
public sealed record ExternalLoginInfoDto(
    string Provider,
    string ProviderKey,
    string? Email,
    bool EmailVerified,
    string? FirstName,
    string? LastName,
    int? Age,
    DateOnly? DateOfBirth);
