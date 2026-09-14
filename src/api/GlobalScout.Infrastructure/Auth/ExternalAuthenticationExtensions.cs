using System.Security.Claims;
using AspNet.Security.OAuth.Apple;
using GlobalScout.Application.Abstractions.Auth;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace GlobalScout.Infrastructure.Auth;

/// <summary>
/// Registers Google/Facebook/Apple as additional (non-default) authentication schemes, feeding into
/// ASP.NET Core Identity's built-in external-login support (<c>AspNetUserLogins</c>,
/// <c>SignInManager.GetExternalLoginInfoAsync</c>) rather than a hand-rolled OAuth2 client, per
/// specs/001-oauth2-signup/research.md. JwtBearer remains this app's default authenticate/challenge
/// scheme (see DependencyInjection.AddGlobalScoutIdentity) - these three schemes are only ever invoked
/// explicitly via <c>Results.Challenge(..., [providerScheme])</c> from GetAuthExternalChallenge.
/// </summary>
public static class ExternalAuthenticationExtensions
{
    public static IServiceCollection AddExternalAuthentication(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<ExternalAuthOptions>(configuration.GetSection(ExternalAuthOptions.SectionName));

        services.AddSingleton<IHandoffCodeStore, HandoffCodeStore>();
        services.AddScoped<IExternalIdentityStore, ExternalIdentityStore>();
        services.AddScoped<IExternalLoginAccessor, ExternalLoginAccessor>();

        var options = configuration.GetSection(ExternalAuthOptions.SectionName).Get<ExternalAuthOptions>()
                      ?? new ExternalAuthOptions();

        var authBuilder = services.AddAuthentication();

        // Register each provider only if it's actually configured. ASP.NET Core's authentication
        // middleware resolves (and validates) every registered remote-auth scheme's Options on every
        // request - not just the one being challenged - to ask "is this request your callback?" via
        // ShouldHandleRequestAsync. An unconfigured provider (empty ClientId/AppId) would therefore
        // fail Validate() and break ALL requests, not just its own, if registered unconditionally. This
        // also means providers can be rolled out incrementally (FR-002's "structured so additional
        // providers can be added" requirement) without the other two needing credentials yet.
        if (!string.IsNullOrWhiteSpace(options.Google.ClientId))
        {
            authBuilder.AddGoogle(o =>
            {
                o.SignInScheme = IdentityConstants.ExternalScheme;
                o.ClientId = options.Google.ClientId;
                o.ClientSecret = options.Google.ClientSecret;
                o.CallbackPath = "/signin-oauth/google";
                o.ClaimActions.MapJsonKey("email_verified", "email_verified");
                o.Events.OnRemoteFailure = HandleRemoteFailure("google");
            });
        }

        if (!string.IsNullOrWhiteSpace(options.Facebook.ClientId))
        {
            authBuilder.AddFacebook(o =>
            {
                o.SignInScheme = IdentityConstants.ExternalScheme;
                o.ClientId = options.Facebook.ClientId;
                o.ClientSecret = options.Facebook.ClientSecret;
                o.CallbackPath = "/signin-oauth/facebook";
                o.Fields.Add("email");
                o.Fields.Add("first_name");
                o.Fields.Add("last_name");
                o.ClaimActions.MapJsonKey(ClaimTypes.GivenName, "first_name");
                o.ClaimActions.MapJsonKey(ClaimTypes.Surname, "last_name");
                o.Events.OnRemoteFailure = HandleRemoteFailure("facebook");
            });
        }

        if (!string.IsNullOrWhiteSpace(options.Apple.ClientId))
        {
            authBuilder.AddApple(o =>
            {
                o.SignInScheme = IdentityConstants.ExternalScheme;
                o.ClientId = options.Apple.ClientId;
                o.KeyId = options.Apple.KeyId;
                o.TeamId = options.Apple.TeamId;
                o.PrivateKey = (_, _) => Task.FromResult(options.Apple.PrivateKey.AsMemory());
                o.CallbackPath = "/signin-oauth/apple";
                o.Events.OnRemoteFailure = HandleRemoteFailure("apple");
            });
        }

        return services;
    }

    /// <summary>
    /// The framework's default remote-failure behavior (denied consent, provider-side error/timeout)
    /// does not reach our own code at all. Redirect it back to our own callback endpoint with a marker
    /// instead, so GetAuthExternalCallback can render the FR-012 failure form_post uniformly.
    /// </summary>
    private static Func<RemoteFailureContext, Task> HandleRemoteFailure(string provider) =>
        context =>
        {
            context.HandleResponse();
            context.Response.Redirect($"/api/auth/external/{provider}/callback?remoteError=1");
            return Task.CompletedTask;
        };
}
