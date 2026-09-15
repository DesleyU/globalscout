using GlobalScout.Application.Social;
using GlobalScout.Application.Social.Follow;
using GlobalScout.Domain.Identity;
using GlobalScout.SharedKernel;
using Xunit;

namespace GlobalScout.Application.UnitTests.Social.Follow;

public sealed class FollowEligibilityTests
{
    [Theory]
    [InlineData(UserRole.Player, UserRole.Player)]
    [InlineData(UserRole.ScoutAgent, UserRole.Player)]
    public void Evaluate_allows_permitted_pairings(UserRole follower, UserRole target)
    {
        var result = FollowEligibility.Evaluate(follower, target);

        Assert.True(result.IsSuccess);
    }

    [Theory]
    [InlineData(UserRole.Player, UserRole.Club, "Social.FollowRestrictedToPlayers")]
    [InlineData(UserRole.Player, UserRole.ScoutAgent, "Social.FollowRestrictedToPlayers")]
    [InlineData(UserRole.Player, UserRole.Pending, "Social.FollowRestrictedToPlayers")]
    [InlineData(UserRole.Player, UserRole.Admin, "Social.AdminNotInFollowGraph")]
    [InlineData(UserRole.ScoutAgent, UserRole.Club, "Social.AgentsCanOnlyFollowPlayers")]
    [InlineData(UserRole.ScoutAgent, UserRole.ScoutAgent, "Social.AgentsCanOnlyFollowPlayers")]
    [InlineData(UserRole.ScoutAgent, UserRole.Pending, "Social.AgentsCanOnlyFollowPlayers")]
    [InlineData(UserRole.ScoutAgent, UserRole.Admin, "Social.AdminNotInFollowGraph")]
    [InlineData(UserRole.Admin, UserRole.Player, "Social.AdminNotInFollowGraph")]
    [InlineData(UserRole.Admin, UserRole.Club, "Social.AdminNotInFollowGraph")]
    [InlineData(UserRole.Admin, UserRole.ScoutAgent, "Social.AdminNotInFollowGraph")]
    [InlineData(UserRole.Admin, UserRole.Pending, "Social.AdminNotInFollowGraph")]
    [InlineData(UserRole.Admin, UserRole.Admin, "Social.AdminNotInFollowGraph")]
    [InlineData(UserRole.Club, UserRole.Admin, "Social.AdminNotInFollowGraph")]
    [InlineData(UserRole.Pending, UserRole.Admin, "Social.AdminNotInFollowGraph")]
    [InlineData(UserRole.Club, UserRole.Player, "Social.FollowNotEligible")]
    [InlineData(UserRole.Club, UserRole.Club, "Social.FollowNotEligible")]
    [InlineData(UserRole.Club, UserRole.ScoutAgent, "Social.FollowNotEligible")]
    [InlineData(UserRole.Club, UserRole.Pending, "Social.FollowNotEligible")]
    [InlineData(UserRole.Pending, UserRole.Player, "Social.FollowNotEligible")]
    [InlineData(UserRole.Pending, UserRole.Club, "Social.FollowNotEligible")]
    [InlineData(UserRole.Pending, UserRole.ScoutAgent, "Social.FollowNotEligible")]
    [InlineData(UserRole.Pending, UserRole.Pending, "Social.FollowNotEligible")]
    public void Evaluate_rejects_every_other_pairing_with_a_specific_error(
        UserRole follower,
        UserRole target,
        string expectedErrorCode)
    {
        var result = FollowEligibility.Evaluate(follower, target);

        Assert.True(result.IsFailure);
        Assert.Equal(expectedErrorCode, result.Error.Code);
    }

    [Fact]
    public void Evaluate_covers_every_role_pairing_exhaustively()
    {
        var roles = Enum.GetValues<UserRole>();
        var allowedPairs = new (UserRole Follower, UserRole Target)[]
        {
            (UserRole.Player, UserRole.Player),
            (UserRole.ScoutAgent, UserRole.Player),
        };

        foreach (var follower in roles)
        {
            foreach (var target in roles)
            {
                var result = FollowEligibility.Evaluate(follower, target);
                var shouldBeAllowed = Array.IndexOf(allowedPairs, (follower, target)) >= 0;
                Assert.Equal(shouldBeAllowed, result.IsSuccess);
            }
        }
    }
}
