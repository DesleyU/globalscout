using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Social;

namespace GlobalScout.Application.Social.Follow.GetFollowStatus;

public sealed record GetFollowStatusQuery(Guid FollowerId, Guid FollowingUserId) : IQuery<GetFollowStatusResult>;
