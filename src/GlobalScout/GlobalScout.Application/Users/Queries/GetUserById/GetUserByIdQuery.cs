using GlobalScout.Application.Abstractions.Messaging;

namespace GlobalScout.Application.Users.Queries.GetUserById;

public sealed record GetUserByIdQuery(Guid UserId) : IQuery<GetUserByIdResult?>;
