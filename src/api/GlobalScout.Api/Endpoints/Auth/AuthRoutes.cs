namespace GlobalScout.Api.Endpoints.Auth;

internal static class AuthRoutes
{
    public const string Base = "api/auth";

    public static string Register => $"{Base}/register";

    public static string Login => $"{Base}/login";

    public static string Profile => $"{Base}/profile";

    public static string Logout => $"{Base}/logout";
}
