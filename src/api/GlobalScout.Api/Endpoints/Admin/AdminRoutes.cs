namespace GlobalScout.Api.Endpoints.Admin;

internal static class AdminRoutes
{
    public const string Base = "api/admin";

    public static string Users => $"{Base}/users";

    public static string UserStatus => $"{Base}/users/{{userId:guid}}/status";

    public static string UserById => $"{Base}/users/{{userId:guid}}";

    public static string Stats => $"{Base}/stats";

    public static string PlayerClaims => $"{Base}/player-claims";

    public static string PlayerClaimApprove => $"{Base}/player-claims/{{claimId:guid}}/approve";

    public static string PlayerClaimReject => $"{Base}/player-claims/{{claimId:guid}}/reject";

    public static string PlayerClaimRequestInfo => $"{Base}/player-claims/{{claimId:guid}}/request-info";

    public static string PlayerClaimEvidenceReadUrl =>
        $"{Base}/player-claims/{{claimId:guid}}/evidence/{{evidenceId:guid}}/url";
}
