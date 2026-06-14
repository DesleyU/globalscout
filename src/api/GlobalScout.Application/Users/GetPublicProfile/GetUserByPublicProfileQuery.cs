using GlobalScout.Application.Abstractions.Messaging;
using GlobalScout.Application.Users;
using GlobalScout.Domain.Identity;

namespace GlobalScout.Application.Users.GetPublicProfile;

public sealed record GetUserByPublicProfileQuery(
    Guid ViewerUserId,
    UserRole ViewerRole,
    Guid TargetUserId) : IQuery<GetUserByPublicProfileResult?>;
