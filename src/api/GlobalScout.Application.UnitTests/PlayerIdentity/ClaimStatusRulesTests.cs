using GlobalScout.Application.PlayerIdentity;
using GlobalScout.Domain.PlayerIdentity;
using Xunit;

namespace GlobalScout.Application.UnitTests.PlayerIdentity;

public sealed class ClaimStatusRulesTests
{
    [Theory]
    [InlineData(ClaimStatus.Claimed, true)]
    [InlineData(ClaimStatus.PendingVerification, true)]
    [InlineData(ClaimStatus.Verified, true)]
    [InlineData(ClaimStatus.Rejected, false)]
    [InlineData(ClaimStatus.Unmatched, false)]
    public void BlocksNewClaim_matches_expected_statuses(ClaimStatus status, bool expected)
    {
        Assert.Equal(expected, ClaimStatusRules.BlocksNewClaim(status));
    }

    [Theory]
    [InlineData(ClaimStatus.Claimed, true)]
    [InlineData(ClaimStatus.PendingVerification, true)]
    [InlineData(ClaimStatus.Verified, false)]
    [InlineData(ClaimStatus.Rejected, false)]
    public void CanAddEvidence_matches_expected_statuses(ClaimStatus status, bool expected)
    {
        Assert.Equal(expected, ClaimStatusRules.CanAddEvidence(status));
    }

    [Fact]
    public void CanReview_only_allows_pending_verification()
    {
        Assert.True(ClaimStatusRules.CanReview(ClaimStatus.PendingVerification));
        Assert.False(ClaimStatusRules.CanReview(ClaimStatus.Claimed));
        Assert.False(ClaimStatusRules.CanReview(ClaimStatus.Verified));
        Assert.False(ClaimStatusRules.CanReview(ClaimStatus.Rejected));
    }
}
