using GlobalScout.SharedKernel;

namespace GlobalScout.Application.PlayerIdentity;

public static class PlayerIdentityErrors
{
    public static readonly Error OnlyPlayers =
        Error.Forbidden("PlayerIdentity.OnlyPlayers", "Only player accounts can use player identity linking.");

    public static readonly Error ExternalSearchUnavailable =
        Error.Problem("PlayerIdentity.ExternalSearchUnavailable", "Could not search external player databases.");

    public static readonly Error CandidateNotFound =
        Error.NotFound("PlayerIdentity.CandidateNotFound", "The selected player profile was not found in search results.");

    public static readonly Error ClaimNotFound =
        Error.NotFound("PlayerIdentity.ClaimNotFound", "Player identity claim not found.");

    public static readonly Error ClaimAlreadyExists =
        Error.Conflict("PlayerIdentity.ClaimAlreadyExists", "You already have an active player identity claim.");

    public static readonly Error ExternalPlayerIdTaken =
        Error.Conflict("PlayerIdentity.ExternalPlayerIdTaken", "This external player profile is already linked to another account.");

    public static readonly Error InvalidStatusTransition =
        Error.Problem("PlayerIdentity.InvalidStatusTransition", "This action is not allowed for the current claim status.");

    public static readonly Error EvidenceStorageKeyForbidden =
        Error.Forbidden("PlayerIdentity.Evidence.StorageKeyForbidden", "The uploaded evidence does not belong to the current user.");

    public static readonly Error EvidenceRequiresFileOrUrl =
        Error.Validation("PlayerIdentity.Evidence.Missing", "Evidence must include either an uploaded file or a URL.");

    public static readonly Error EvidenceNotFound =
        Error.NotFound("PlayerIdentity.Evidence.NotFound", "Verification evidence not found.");

    public static readonly Error InvalidPosition =
        Error.Validation("PlayerIdentity.InvalidPosition", "Invalid position.");

    public static readonly Error InvalidClaimStatus =
        Error.Validation("PlayerIdentity.InvalidClaimStatus", "Invalid claim status filter.");
}
