using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Social;

namespace GlobalScout.Application.Social.FollowLists;

public sealed record GetFollowersQuery(Guid UserId, int Page, int Limit) : IQuery<GetFollowListResult>;
