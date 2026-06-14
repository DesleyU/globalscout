namespace GlobalScout.Domain.PlayerIdentity;

public enum ClaimStatus
{
    Unmatched = 0,
    Suggested = 1,
    Claimed = 2,
    PendingVerification = 3,
    Verified = 4,
    Rejected = 5
}
