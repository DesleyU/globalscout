using GlobalScout.Application.Abstractions.Auth;

namespace GlobalScout.Api.IntegrationTests.Auth.ExternalLogin;

/// <summary>
/// Stands in for the live Google/Facebook/Apple OAuth2 handshake in integration tests: hands back a
/// fixed, scenario-controlled <see cref="ExternalLoginInfoDto"/> - the same shape
/// SignInManager.GetExternalLoginInfoAsync produces for a real provider - instead of ever making a
/// network call. Real Postgres is still used throughout; this is the only substituted seam, per
/// specs/001-oauth2-signup/research.md's testing-strategy decision. Registered per-test via
/// ExternalLoginIntegrationTestHelpers.WithFakeExternalLogin, mirroring FakeExternalPlayerSearch.
/// </summary>
internal sealed class FakeExternalLoginAccessor(ExternalLoginInfoDto info) : IExternalLoginAccessor
{
    public Task<ExternalLoginInfoDto?> GetExternalLoginInfoAsync(CancellationToken cancellationToken) =>
        Task.FromResult<ExternalLoginInfoDto?>(info);
}
