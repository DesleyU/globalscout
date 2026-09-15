using System.Collections.Generic;
using GlobalScout.Application.Subscriptions;
using GlobalScout.SharedKernel;

namespace GlobalScout.Application.Social;

public static class SocialErrors
{
    public static readonly Error UserNotFound =
        Error.NotFound("Social.UserNotFound", "User not found.");

    public static readonly Error CannotConnectToSelf =
        Error.Problem("Social.CannotConnectToSelf", "Cannot connect to yourself.");

    public static readonly Error ConnectionAlreadyExists =
        Error.Problem("Social.ConnectionExists", "Connection request already exists.");

    public static readonly Error ConnectionReverseExists =
        Error.Problem("Social.ConnectionReverseExists", "Connection already exists or pending.");

    public static readonly Error ConnectionInvalidAction =
        Error.Problem("Social.ConnectionInvalidAction", "Invalid action. Use \"accept\" or \"reject\".");

    public static readonly Error ConnectionRequestNotFound =
        Error.NotFound("Social.ConnectionNotFound", "Connection request not found.");

    public static readonly Error CannotFollowSelf =
        Error.Problem("Social.CannotFollowSelf", "You cannot follow yourself.");

    public static readonly Error AlreadyFollowing =
        Error.Problem("Social.AlreadyFollowing", "You are already following this user.");

    public static readonly Error NotFollowing =
        Error.NotFound("Social.NotFollowing", "You are not following this user.");

    public static readonly Error FollowRestrictedToPlayers =
        Error.Problem("Social.FollowRestrictedToPlayers", "Players can only follow other Players.");

    public static readonly Error AgentsCanOnlyFollowPlayers =
        Error.Problem("Social.AgentsCanOnlyFollowPlayers", "Agents can only follow Players.");

    public static readonly Error AdminNotInFollowGraph =
        Error.Problem("Social.AdminNotInFollowGraph", "Admin accounts do not participate in the follow graph.");

    public static readonly Error FollowNotEligible =
        Error.Problem("Social.FollowNotEligible", "This account type cannot follow other users.");

    public static readonly Error InvalidPendingRequestType =
        Error.Problem("Social.InvalidRequestType", "Invalid type. Use \"received\" or \"sent\".");

    public static Error ConnectionLimitReached(int currentConnections) =>
        Error.Forbidden(
            "Connections.LimitReached",
            $"Basic users can have maximum {SubscriptionLimits.BasicMaxConnections} connections. Upgrade to Premium for unlimited connections.",
            new Dictionary<string, object?>
            {
                ["currentConnections"] = currentConnections,
                ["maxConnections"] = SubscriptionLimits.BasicMaxConnections,
                ["tier"] = "BASIC"
            });
}
