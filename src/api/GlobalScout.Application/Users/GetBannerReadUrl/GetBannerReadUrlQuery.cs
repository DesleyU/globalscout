using GlobalScout.Application.Abstractions.Messaging;

namespace GlobalScout.Application.Users.GetBannerReadUrl;

public sealed record GetBannerReadUrlQuery(Guid OwnerId) : IQuery<BannerReadUrlResult>;
