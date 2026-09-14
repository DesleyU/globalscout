using GlobalScout.Infrastructure.Identity;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;

namespace GlobalScout.Api.Endpoints.Auth;

/// <summary>
/// Starts the OAuth2 flow. Browser-navigated (a plain link/form action, not fetched via XHR/JSON) - see
/// contracts/api-auth-external.md. Any <c>provider</c> other than google/facebook/apple resolves 404, as
/// does a recognized provider name that isn't configured yet (see ExternalAuthenticationExtensions -
/// providers without credentials aren't registered as schemes at all).
/// </summary>
internal sealed class GetAuthExternalChallenge : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet(
                AuthRoutes.ExternalChallenge,
                async (
                    string provider,
                    string? returnUrl,
                    IAuthenticationSchemeProvider schemeProvider,
                    SignInManager<ApplicationUser> signInManager) =>
                {
                    if (!ExternalProviders.TryGetSchemeName(provider, out var scheme))
                    {
                        return Results.NotFound();
                    }

                    if (await schemeProvider.GetSchemeAsync(scheme) is null)
                    {
                        return Results.NotFound();
                    }

                    // Must be root-relative (leading slash): this survives a round trip through the
                    // provider's own internal CallbackPath (e.g. /signin-oauth/google - see
                    // ExternalAuthenticationExtensions), and a path without a leading slash gets resolved
                    // *relative to that path* by the browser instead of from the site root.
                    var redirectUri = $"/{AuthRoutes.Base}/external/{provider.ToLowerInvariant()}/callback";
                    if (!string.IsNullOrWhiteSpace(returnUrl))
                    {
                        redirectUri += $"?returnUrl={Uri.EscapeDataString(returnUrl)}";
                    }

                    // Must be built via SignInManager, not `new AuthenticationProperties { ... }` directly -
                    // this stamps Items["LoginProvider"] = scheme, which
                    // SignInManager.GetExternalLoginInfoAsync() requires on the callback side to recognize
                    // the round trip at all (it returns null silently, with no error, otherwise).
                    var properties = signInManager.ConfigureExternalAuthenticationProperties(scheme, redirectUri);
                    return Results.Challenge(properties, [scheme]);
                })
            .AllowAnonymous()
            .WithName("GetAuthExternalChallenge")
            .WithTags(AuthEndpointTags.Authentication);
    }
}
