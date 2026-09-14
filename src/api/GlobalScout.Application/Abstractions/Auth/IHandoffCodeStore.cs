namespace GlobalScout.Application.Abstractions.Auth;

/// <summary>
/// Single-use, short-TTL opaque code storage used to hand a completed external-login outcome
/// from the API-hosted OAuth2 callback across to the Next.js BFF, without ever putting the JWT
/// itself (or the code) in a redirect URL. See specs/001-oauth2-signup/research.md.
/// </summary>
public interface IHandoffCodeStore
{
    /// <summary>Mints a new single-use code bound to <paramref name="userId"/>, valid for <paramref name="ttl"/>.</summary>
    string Issue(Guid userId, TimeSpan ttl);

    /// <summary>
    /// Atomically consumes <paramref name="code"/> if it exists and has not expired. A code can only
    /// ever be consumed once, regardless of outcome.
    /// </summary>
    bool TryConsume(string code, out Guid userId);
}
