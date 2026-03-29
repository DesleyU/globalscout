using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Social;

namespace GlobalScout.Application.Social.FollowLists;

public sealed record GetFollowStatsQuery(Guid UserId) : IQuery<GetFollowStatsResult>;
