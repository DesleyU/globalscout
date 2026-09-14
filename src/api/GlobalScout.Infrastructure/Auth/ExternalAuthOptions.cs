namespace GlobalScout.Infrastructure.Auth;

/// <summary>
/// OAuth2 client credentials for the supported social sign-up providers, plus the frontend origin the
/// API-hosted callback hands the browser back to. Follows the existing <c>Section__Key</c> env-var
/// convention (see docker-compose.yml's <c>Jwt__*</c>/<c>Stripe__*</c>).
/// </summary>
public sealed class ExternalAuthOptions
{
    public const string SectionName = "Authentication";

    /// <summary>
    /// Public URL of the frontend (no trailing slash) the OAuth2 callback's self-submitting form_post
    /// page targets - e.g. <c>https://globalscout.eu</c> in production, per Constitution Principle V.
    /// Shares the same underlying value as <c>Stripe:PublicAppBaseUrl</c> (both are "the frontend's
    /// public origin"), wired independently so this feature doesn't take a dependency on Billing config.
    /// </summary>
    public string FrontendBaseUrl { get; set; } = "http://localhost:8080";

    public GoogleAuthOptions Google { get; set; } = new();

    public FacebookAuthOptions Facebook { get; set; } = new();

    public AppleAuthOptions Apple { get; set; } = new();

    public sealed class GoogleAuthOptions
    {
        public string ClientId { get; set; } = "";

        public string ClientSecret { get; set; } = "";
    }

    public sealed class FacebookAuthOptions
    {
        public string ClientId { get; set; } = "";

        public string ClientSecret { get; set; } = "";
    }

    public sealed class AppleAuthOptions
    {
        public string ClientId { get; set; } = "";

        public string KeyId { get; set; } = "";

        public string TeamId { get; set; } = "";

        /// <summary>PEM contents of the private key (<c>AuthKey_{KeyId}.p8</c>), not a file path.</summary>
        public string PrivateKey { get; set; } = "";
    }
}
