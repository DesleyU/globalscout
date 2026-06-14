namespace GlobalScout.Api.Endpoints.PlayerIdentity;

internal static class PlayerIdentityRoutes
{
    public const string Base = "api/player-identity";

    public static string Search => $"{Base}/search";

    public static string Claims => $"{Base}/claims";

    public static string ClaimsMe => $"{Base}/claims/me";

    public static string EvidenceUploadUrl => $"{Base}/claims/me/evidence/upload-url";

    public static string EvidenceComplete => $"{Base}/claims/me/evidence/complete";

    public static string EvidenceLink => $"{Base}/claims/me/evidence/link";
}
