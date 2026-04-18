using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Media;

namespace GlobalScout.Application.Media.GetUserVideos;

/// <param name="OwnerUserId">Profile whose videos to list (current user or another user).</param>
public sealed record GetUserVideosQuery(Guid OwnerUserId) : IQuery<IReadOnlyList<MediaVideoListItemDto>>;
