using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Abstractions.Auth;

/// <summary>
/// Identity operations specific to the OAuth2 external-login feature (find-by-login, find-by-email,
/// link, create-with-login). Kept separate from <see cref="IUserIdentityStore"/> so that feature stays
/// a self-contained slice per Constitution Principle I, rather than growing the password-registration
/// store with OAuth-specific concerns.
/// </summary>
public interface IExternalIdentityStore
{
    /// <summary>Looks up a user already linked to this exact provider identity (returning-user path, FR-009).</summary>
    Task<Guid?> FindUserIdByLoginAsync(string provider, string providerKey, CancellationToken cancellationToken);

    /// <summary>Looks up a user by email, regardless of how that account was originally created.</summary>
    Task<Guid?> FindUserIdByEmailAsync(string email, CancellationToken cancellationToken);

    /// <summary>Links a new provider identity to an existing account (FR-010 auto-link).</summary>
    Task<Result> LinkLoginAsync(Guid userId, string provider, string providerKey, CancellationToken cancellationToken);

    /// <summary>Creates a brand-new account (role PENDING) with this provider identity already linked (FR-001-FR-006).</summary>
    Task<Result<Guid>> CreateUserWithLoginAsync(ExternalLoginInfoDto info, CancellationToken cancellationToken);
}
