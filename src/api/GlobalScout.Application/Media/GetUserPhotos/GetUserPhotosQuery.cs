using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Media;

namespace GlobalScout.Application.Media.GetUserPhotos;

/// <param name="OwnerUserId">Profile whose photos to list (current user or another user).</param>
public sealed record GetUserPhotosQuery(Guid OwnerUserId) : IQuery<IReadOnlyList<MediaVideoListItemDto>>;
