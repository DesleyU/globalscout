using GlobalScout.Application.Abstractions.Messaging;

namespace GlobalScout.Application.Users.GetAvatarReadUrl;

public sealed record GetAvatarReadUrlQuery(Guid OwnerId) : IQuery<AvatarReadUrlResult>;
