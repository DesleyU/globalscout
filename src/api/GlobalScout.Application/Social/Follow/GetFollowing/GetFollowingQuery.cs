using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Social;

namespace GlobalScout.Application.Social.Follow.GetFollowing;

public sealed record GetFollowingQuery(Guid UserId, int Page, int Limit) : IQuery<GetFollowListResult>;
