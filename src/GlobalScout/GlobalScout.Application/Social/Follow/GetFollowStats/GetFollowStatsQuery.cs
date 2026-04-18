using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Social;

namespace GlobalScout.Application.Social.Follow.GetFollowStats;

public sealed record GetFollowStatsQuery(Guid UserId) : IQuery<GetFollowStatsResult>;
