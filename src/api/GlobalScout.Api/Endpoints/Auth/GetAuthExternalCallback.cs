using System.Text;
using System.Text.Encodings.Web;
using GlobalScout.Application.Abstractions.Auth;
using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Auth.ExternalLogin;
using GlobalScout.Infrastructure.Auth;
using GlobalScout.SharedKernel;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;

namespace GlobalScout.Api.Endpoints.Auth;

/// <summary>
/// The provider redirects the browser here after consent (indirectly - see
/// ExternalAuthenticationExtensions for why there's an invisible intermediate hop through the
/// provider's own internal signin-{provider} path first). Resolves the account decision (find/link/
/// create/reject, see CompleteExternalLoginCommand) and hands the outcome to the frontend via a
/// single-use handoff code carried in a self-submitting form_post - never in a redirect URL. See
/// contracts/api-auth-external.md.
/// </summary>
internal sealed class GetAuthExternalCallback : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet(
                AuthRoutes.ExternalCallback,
                async (
                    string provider,
                    string? remoteError,
                    HttpContext httpContext,
                    ICommandHandler<CompleteExternalLoginCommand, CompleteExternalLoginResult> handler,
                    IHandoffCodeStore handoffCodeStore,
                    IOptions<ExternalAuthOptions> authOptions,
                    ILogger<GetAuthExternalCallback> logger,
                    CancellationToken cancellationToken) =>
                {
                    if (!ExternalProviders.TryGetSchemeName(provider, out var scheme))
                    {
                        return Results.NotFound();
                    }

                    var frontendBaseUrl = authOptions.Value.FrontendBaseUrl.TrimEnd('/');

                    if (!string.IsNullOrEmpty(remoteError))
                    {
                        logger.LogInformation(
                            "External login challenge for {Provider} did not complete: provider error or consent denied.",
                            scheme);
                        return FormPostResult(frontendBaseUrl, "error", "access_denied");
                    }

                    logger.LogInformation("External login callback received for {Provider}.", scheme);

                    var result = await handler.Handle(new CompleteExternalLoginCommand(scheme), cancellationToken);

                    // The temporary external-sign-in cookie has served its purpose (carrying
                    // ExternalLoginInfo from the provider's own internal callback into this request) and
                    // must not linger regardless of outcome.
                    await httpContext.SignOutAsync(IdentityConstants.ExternalScheme);

                    if (result.IsFailure)
                    {
                        logger.LogWarning(
                            "External login for {Provider} rejected: {ErrorCode}.",
                            scheme,
                            result.Error.Code);
                        return FormPostResult(frontendBaseUrl, "error", MapErrorToReason(result.Error));
                    }

                    var code = handoffCodeStore.Issue(result.Value.UserId, TimeSpan.FromSeconds(60));
                    logger.LogInformation(
                        "External login for {Provider} succeeded ({Outcome}); handoff code issued.",
                        scheme,
                        result.Value.IsNewAccount ? "new account" : "existing account");
                    return FormPostResult(frontendBaseUrl, "code", code);
                })
            .AllowAnonymous()
            .WithName("GetAuthExternalCallback")
            .WithTags(AuthEndpointTags.Authentication);
    }

    private static string MapErrorToReason(Error error) => error.Code switch
    {
        "ExternalLogin.UnderAge" => "under_age",
        "ExternalLogin.EmailInUse" => "email_in_use",
        _ => "provider_error"
    };

    /// <summary>
    /// A minimal self-submitting HTML page that POSTs a single field to the frontend's
    /// <c>/api/auth/external/complete</c> BFF route. A POST body - unlike a `302 ?code=` redirect - never
    /// appears in the URL, browser history, typical access-log formats, or Referer headers; that (plus
    /// the handoff code's single-use, 60s-TTL enforcement in HandoffCodeStore) is what actually secures
    /// this handoff. A CSP `form-action` restriction was tried here as additional defense-in-depth, but
    /// dropped: it hit a real-world Chrome inconsistency (confirmed against the CSP3 spec and MDN, which
    /// documents form-action's redirect/edge-case matching as inconsistent across browsers) that blocked
    /// the legitimate submission even with a syntactically-correct, spec-compliant policy. The page's
    /// entire content is server-generated with no attacker-controlled input (the only two dynamic values,
    /// `code`/`error`, are HTML-encoded below), so there's no real XSS surface for a CSP to guard here.
    /// </summary>
    private static IResult FormPostResult(string frontendBaseUrl, string fieldName, string fieldValue)
    {
        var targetUrl = HtmlEncoder.Default.Encode($"{frontendBaseUrl}/api/auth/external/complete");
        var encodedField = HtmlEncoder.Default.Encode(fieldName);
        var encodedValue = HtmlEncoder.Default.Encode(fieldValue);

        var html = $"""
            <!doctype html>
            <html><head><meta charset="utf-8"><title>Signing in&hellip;</title></head>
            <body>
            <form id="f" method="post" action="{targetUrl}">
            <input type="hidden" name="{encodedField}" value="{encodedValue}" />
            <noscript><button type="submit">Continue</button></noscript>
            </form>
            <script>document.getElementById('f').submit();</script>
            </body></html>
            """;

        return Results.Content(html, "text/html", Encoding.UTF8);
    }
}
