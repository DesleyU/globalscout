namespace GlobalScout.Api.Endpoints.Auth;

/// <summary>Maps the lowercase path-segment provider names used in URLs to the registered ASP.NET Core
/// authentication scheme names (see Infrastructure/Auth/ExternalAuthenticationExtensions.cs).</summary>
internal static class ExternalProviders
{
    public static bool TryGetSchemeName(string provider, out string scheme)
    {
        scheme = provider.ToLowerInvariant() switch
        {
            "google" => "Google",
            "facebook" => "Facebook",
            "apple" => "Apple",
            _ => ""
        };

        return scheme.Length > 0;
    }
}
