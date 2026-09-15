using GlobalScout.Domain.Identity;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Social.Follow;

internal static class FollowEligibility
{
    public static Result Evaluate(UserRole followerRole, UserRole targetRole) =>
        (followerRole, targetRole) switch
        {
            (UserRole.Player, UserRole.Player) => Result.Success(),
            (UserRole.ScoutAgent, UserRole.Player) => Result.Success(),
            (_, UserRole.Admin) => Result.Failure(SocialErrors.AdminNotInFollowGraph),
            (UserRole.Admin, _) => Result.Failure(SocialErrors.AdminNotInFollowGraph),
            (UserRole.Player, _) => Result.Failure(SocialErrors.FollowRestrictedToPlayers),
            (UserRole.ScoutAgent, _) => Result.Failure(SocialErrors.AgentsCanOnlyFollowPlayers),
            _ => Result.Failure(SocialErrors.FollowNotEligible)
        };
}
