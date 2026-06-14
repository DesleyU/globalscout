using GlobalScout.Application.Abstractions.Messaging;

namespace GlobalScout.Application.Users.GetProfile;

public sealed record GetUsersProfileQuery(Guid UserId) : IQuery<GlobalScout.Application.Users.UsersFullProfileResult?>;
