using GlobalScout.Application.Abstractions.Messaging;

namespace GlobalScout.Application.Auth.GetProfile;

public sealed record GetAuthProfileQuery(Guid UserId) : IQuery<GetAuthProfileResult>;
