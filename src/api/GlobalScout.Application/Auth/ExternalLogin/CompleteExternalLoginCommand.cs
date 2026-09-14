using GlobalScout.Application.Abstractions.Messaging;

namespace GlobalScout.Application.Auth.ExternalLogin;

/// <summary>
/// Resolves the outcome of an OAuth2 callback for <paramref name="Provider"/> into a signed-in user:
/// an existing linked account (FR-009), an auto-linked existing account on a provider-verified email
/// match (FR-010), a newly created account (FR-001-FR-006), or a rejection (FR-010 unverified-email
/// collision, FR-011 under-16). See specs/001-oauth2-signup/data-model.md for the full decision tree.
/// </summary>
public sealed record CompleteExternalLoginCommand(string Provider) : ICommand<CompleteExternalLoginResult>;

public sealed record CompleteExternalLoginResult(Guid UserId, bool IsNewAccount);
