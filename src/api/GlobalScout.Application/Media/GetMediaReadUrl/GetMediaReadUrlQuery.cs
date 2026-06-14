using GlobalScout.Application.Abstractions.Messaging;

namespace GlobalScout.Application.Media.GetMediaReadUrl;

public sealed record GetMediaReadUrlQuery(Guid RequesterId, Guid MediaId) : IQuery<MediaReadUrlResult>;
