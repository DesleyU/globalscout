namespace GlobalScout.Api.Endpoints.Auth;

internal static class AuthRoutes
{
    public const string Base = "api/auth";

    public static string Register => $"{Base}/register";

    public static string Login => $"{Base}/login";

    public static string Profile => $"{Base}/profile";

    public static string Logout => $"{Base}/logout";

    public static string VerifyEmail => $"{Base}/verify-email";

    public static string ResendVerification => $"{Base}/resend-verification";

    public static string ExternalChallenge => $"{Base}/external/{{provider}}/challenge";

    public static string ExternalCallback => $"{Base}/external/{{provider}}/callback";

    public static string ExternalExchange => $"{Base}/external/exchange";
}
